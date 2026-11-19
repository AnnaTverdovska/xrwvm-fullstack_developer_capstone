// Component tests with the Django API replaced by a fake fetch: `npm test`
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Register from './components/Register/Register';
import Dealers from './components/Dealers/Dealers';
import Dealer from './components/Dealers/Dealer';

const DEALERS = [
  { id: 1, full_name: 'Holdlamis Car Dealership', city: 'El Paso', address: '3 Nova Court', zip: '88563', state: 'Texas' },
  { id: 2, full_name: 'Temp Car Dealership', city: 'Minneapolis', address: '6337 Butternut Crossing', zip: '55413', state: 'Minnesota' },
];

// Answer each URL the components call with the given JSON
const fakeFetch = (routes) =>
  jest.fn((url) => {
    const path = Object.keys(routes).find((key) => url.endsWith(key));
    if (!path) return Promise.reject(new Error(`Unexpected request: ${url}`));
    return Promise.resolve({ json: () => Promise.resolve(routes[path]) });
  });

beforeEach(() => {
  sessionStorage.clear();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Register', () => {
  test('signs the user up and remembers them', async () => {
    global.fetch = fakeFetch({ '/djangoapp/register': { userName: 'anna', status: 'Authenticated' } });
    render(<Register />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'anna' } });
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 's3cret-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(sessionStorage.getItem('username')).toBe('anna'));
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ userName: 'anna', password: 's3cret-pass', firstName: 'Anna' });
    expect(sessionStorage.getItem('firstname')).toBe('Anna');
  });

  test('explains when the username is taken', async () => {
    global.fetch = fakeFetch({ '/djangoapp/register': { userName: 'anna', error: 'Already Registered' } });
    render(<Register />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'anna' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is taken');
    expect(sessionStorage.getItem('username')).toBeNull();
  });

  test('asks for a username and password before calling the server', async () => {
    global.fetch = jest.fn();
    render(<Register />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a username and a password');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('Dealers', () => {
  test('lists the dealers and filters by state', async () => {
    global.fetch = fakeFetch({
      '/djangoapp/get_dealers': { status: 200, dealers: DEALERS },
      '/djangoapp/get_dealers/Texas': { status: 200, dealers: [DEALERS[0]] },
    });
    render(<Dealers />);

    expect(await screen.findByText('Temp Car Dealership')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 dealers

    fireEvent.change(screen.getByLabelText('Filter by state'), { target: { value: 'Texas' } });
    await waitFor(() => expect(screen.queryByText('Temp Car Dealership')).not.toBeInTheDocument());
    expect(screen.getByText('Holdlamis Car Dealership')).toBeInTheDocument();
  });

  test('shows the review column only when logged in', async () => {
    sessionStorage.setItem('username', 'anna');
    global.fetch = fakeFetch({ '/djangoapp/get_dealers': { status: 200, dealers: DEALERS } });
    render(<Dealers />);
    expect(await screen.findByText('Review Dealer')).toBeInTheDocument();
    expect(await screen.findAllByAltText('Post Review')).toHaveLength(2);
  });
});

describe('Dealer', () => {
  const renderDealer = () =>
    render(
      <MemoryRouter initialEntries={['/dealer/2']}>
        <Routes>
          <Route path="/dealer/:id" element={<Dealer />} />
        </Routes>
      </MemoryRouter>,
    );

  test('shows the dealer and each review with its sentiment', async () => {
    global.fetch = fakeFetch({
      '/djangoapp/dealer/2': { status: 200, dealer: [DEALERS[1]] },
      '/djangoapp/reviews/dealer/2': {
        status: 200,
        reviews: [
          { id: 7, name: 'Gwenora', review: 'Friendly staff', sentiment: 'positive', car_make: 'Audi', car_model: 'A4', car_year: 2021 },
          { id: 8, name: 'Berkly', review: 'Rude and slow', sentiment: 'negative', car_make: 'Kia', car_model: 'Cerato', car_year: 2019 },
        ],
      },
    });
    renderDealer();

    expect(await screen.findByRole('heading', { name: /Temp Car Dealership/ })).toBeInTheDocument();
    const review = (await screen.findByText('Rude and slow')).closest('.review_panel');
    expect(within(review).getByAltText('Sentiment: negative')).toBeInTheDocument();
    expect(screen.getByAltText('Sentiment: positive')).toBeInTheDocument();
  });

  test('says so when there are no reviews yet', async () => {
    global.fetch = fakeFetch({
      '/djangoapp/dealer/2': { status: 200, dealer: [DEALERS[1]] },
      '/djangoapp/reviews/dealer/2': { status: 200, reviews: [] },
    });
    renderDealer();
    expect(await screen.findByText('No reviews yet!')).toBeInTheDocument();
  });
});
