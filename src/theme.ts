export const colors = {
  text: '#111111',
  muted: '#6b6b6b',
  border: '#e4e4e4',
  background: '#ffffff',
  surface: '#f6f5f3',
  primary: '#111111',
  onPrimary: '#ffffff',
  sale: '#c8102e',
  success: '#1f7a3a',
  disabled: '#bdbdbd',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export function formatPrice(value: number, currency = 'QAR'): string {
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  const fixed = value.toFixed(hasFraction ? 2 : 0);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency} ${dec ? `${grouped}.${dec}` : grouped}`;
}
