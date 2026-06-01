/**
 * Mobile E2E smoke tests – core flows (closes #370)
 *
 * Covers:
 *  1. App launch – Welcome screen renders key elements
 *  2. Dashboard navigation – status filters and escrow list render
 *  3. Escrow detail – detail screen renders mocked escrow data
 *
 * Run locally:
 *   cd apps/mobile && pnpm test -- --testPathPattern=smoke
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ─── Shared mocks ────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'escrow-1' }),
}));

jest.mock('../services/auth', () => ({
  isAuthenticated: () => false,
  consumePendingRedirect: () => null,
  requireAuth: jest.fn().mockReturnValue(true),
  setAuthState: jest.fn(),
}));

jest.mock('../services/wallet', () => ({
  connectWithBuiltInWallet: jest.fn(),
  openExternalWalletGuide: jest.fn(),
}));

const MOCK_ESCROW = {
  id: 'escrow-1',
  title: 'Test Escrow',
  description: 'Smoke test escrow',
  amount: '100',
  asset: 'XLM',
  creatorAddress: 'GABC',
  counterpartyAddress: 'GXYZ',
  deadline: new Date(Date.now() + 86400000).toISOString(),
  status: 'funded' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  milestones: [{ id: 'm1', title: 'Milestone 1', amount: '100', status: 'pending' as const }],
  parties: [],
  events: [],
};

jest.mock('../services/api', () => ({
  escrowApi: {
    list: jest.fn().mockResolvedValue({ escrows: [MOCK_ESCROW], hasNextPage: false, totalCount: 1, totalPages: 1 }),
    getById: jest.fn().mockResolvedValue(MOCK_ESCROW),
    create: jest.fn(),
    releaseMilestone: jest.fn(),
    getTxStatus: jest.fn(),
  },
  notificationApi: {
    list: jest.fn().mockResolvedValue({ notifications: [], unreadCount: 0 }),
    getUnreadCount: jest.fn().mockResolvedValue(0),
    markAsRead: jest.fn(),
  },
}));

jest.mock('../hooks/useDisputes', () => ({
  useDisputes: () => ({
    dispute: null,
    loading: false,
    error: null,
    raiseDispute: jest.fn(),
    resolveDispute: jest.fn(),
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Smoke: App launch', () => {
  it('renders the Welcome screen with branding and connect button', () => {
    const WelcomeScreen = require('../app/index').default;
    render(<WelcomeScreen />);

    expect(screen.getByText('Vaultix')).toBeTruthy();
    expect(screen.getByText('Trustless Escrow on Stellar')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect wallet to continue' })).toBeTruthy();
  });
});

describe('Smoke: Dashboard navigation', () => {
  it('renders the Dashboard screen with status filter tabs', async () => {
    const DashboardScreen = require('../app/(tabs)/dashboard').default;
    render(<DashboardScreen />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Funded')).toBeTruthy();
  });

  it('renders escrow cards after data loads', async () => {
    const DashboardScreen = require('../app/(tabs)/dashboard').default;
    render(<DashboardScreen />);

    expect(await screen.findByText('Test Escrow')).toBeTruthy();
    expect(await screen.findByText('100 XLM')).toBeTruthy();
  });
});

describe('Smoke: Escrow detail', () => {
  it('renders escrow detail screen with title and milestone', async () => {
    const EscrowDetailScreen = require('../app/escrow/[id]').default;
    render(<EscrowDetailScreen />);

    expect(await screen.findByText('Test Escrow')).toBeTruthy();
    expect(await screen.findByText('Milestone 1')).toBeTruthy();
  });
});
