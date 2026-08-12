import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PrivacyPage } from '@/features/legal/PrivacyPage';
import { TermsPage } from '@/features/legal/TermsPage';

describe('Feature: Legal Pages', () => {
  describe('Scenario: Privacy Policy renders correctly', () => {
    it('Given an unauthenticated visitor, When they navigate to /privacy, Then the privacy policy content is displayed', () => {
      render(
        <MemoryRouter initialEntries={['/privacy']}>
          <PrivacyPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
      expect(screen.getByText('1. Información que recopilamos')).toBeInTheDocument();
      expect(screen.getByText('2. Grabaciones de voz')).toBeInTheDocument();
      expect(screen.getByText('4. Servicios de terceros')).toBeInTheDocument();
      expect(screen.getByText('6. Tus derechos')).toBeInTheDocument();
      expect(screen.getByText('10. Contacto')).toBeInTheDocument();
      expect(screen.getByText('ruedarosasdavid@gmail.com')).toBeInTheDocument();
    });
  });

  describe('Scenario: Terms of Use renders correctly', () => {
    it('Given an unauthenticated visitor, When they navigate to /terms, Then the terms of use content is displayed', () => {
      render(
        <MemoryRouter initialEntries={['/terms']}>
          <TermsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Términos de Uso')).toBeInTheDocument();
      expect(screen.getByText('1. Aceptación de los términos')).toBeInTheDocument();
      expect(screen.getByText('3. Aviso médico importante')).toBeInTheDocument();
      expect(screen.getByText('5. Contenido generado por IA')).toBeInTheDocument();
      expect(screen.getByText('8. Limitación de responsabilidad')).toBeInTheDocument();
      expect(screen.getByText('10. Ley aplicable')).toBeInTheDocument();
      expect(screen.getByText('ruedarosasdavid@gmail.com')).toBeInTheDocument();
    });
  });
});
