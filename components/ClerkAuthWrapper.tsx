/// <reference types="vite/client" />
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ReactNode } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    throw new Error('Missing Clerk Publishable Key');
}

interface ClerkAuthWrapperProps {
    children: ReactNode;
}

export function ClerkAuthWrapper({ children }: ClerkAuthWrapperProps) {
    return (
        <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            appearance={{
                baseTheme: undefined,
                variables: {
                    colorPrimary: '#a855f7', // Purple-500
                    colorBackground: '#0b0f19', // Dark background
                    colorInputBackground: '#131b2e', // Slightly lighter dark
                    colorInputText: '#ffffff',
                    colorText: '#e2e8f0', // Slate-200
                    colorTextSecondary: '#94a3b8', // Slate-400
                    colorDanger: '#ef4444', // Red-500
                    colorSuccess: '#10b981', // Emerald-500
                    colorWarning: '#f59e0b', // Amber-500
                    borderRadius: '1rem',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },
                elements: {
                    rootBox: {
                        width: '100%',
                    },
                    card: {
                        backgroundColor: '#0b0f19',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25)',
                    },
                    headerTitle: {
                        color: '#ffffff',
                        fontSize: '1.875rem',
                        fontWeight: '700',
                    },
                    headerSubtitle: {
                        color: '#94a3b8',
                    },
                    socialButtonsBlockButton: {
                        backgroundColor: '#131b2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: '#1e293b',
                            borderColor: '#a855f7',
                        },
                    },
                    formButtonPrimary: {
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                        fontSize: '1rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.75rem 1.5rem',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
                        },
                    },
                    formFieldInput: {
                        backgroundColor: '#131b2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        '&:focus': {
                            borderColor: '#a855f7',
                            boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)',
                        },
                    },
                    formFieldLabel: {
                        color: '#94a3b8',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    },
                    footerActionLink: {
                        color: '#a855f7',
                        '&:hover': {
                            color: '#ec4899',
                        },
                    },
                    identityPreviewText: {
                        color: '#ffffff',
                    },
                    identityPreviewEditButton: {
                        color: '#a855f7',
                    },
                    formResendCodeLink: {
                        color: '#a855f7',
                    },
                    otpCodeFieldInput: {
                        backgroundColor: '#131b2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                    },
                    dividerLine: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    dividerText: {
                        color: '#64748b',
                    },
                },
            }}
        >
            {children}
        </ClerkProvider>
    );
}

export { SignedIn, SignedOut, UserButton, useUser, SignInButton, SignUpButton };
