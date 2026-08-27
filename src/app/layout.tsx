import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Tissu Dubai',
  description: 'Premium fabrics in Casablanca, Morocco'
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return children;
}
