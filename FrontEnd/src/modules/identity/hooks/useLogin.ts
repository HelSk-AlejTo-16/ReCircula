import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, type LoginPayload } from '../services/identity.service';
import { useAuthStore } from '../../../store/authStore';
import { extractErrorMessage } from '../../../shared/utils/extractErrorMessage';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { accessToken, usuario } = await loginService(payload);
      setSession(usuario, accessToken);

      // Redirige según rol
      switch (usuario.rol) {
        case 'ADMINISTRADOR':
          navigate('/admin/dashboard');
          break;
        case 'REPARADOR_VERIFICADO':
          navigate('/reparador/perfil');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}