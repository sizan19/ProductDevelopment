import { render, screen } from '@testing-library/react';
import App from './App';

// Smoke test: the public site shell renders with the AI-Solutions brand.
test('renders the AI-Solutions brand in the navbar', () => {
  render(<App />);
  const brand = screen.getAllByText(/solutions/i)[0];
  expect(brand).toBeInTheDocument();
});
