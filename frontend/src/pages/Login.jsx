import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../lib/api.js';
import useAuthStore from '../store/auth.js';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es obligatoria'),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/auth/login', data);
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: 32 }}>
          <h2 className="auth-title">Iniciar sesion</h2>
          <p className="auth-subtitle">Ingresa a tu cuenta para continuar</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <input
              className="form-input"
              type="email"
              {...register('email')}
              placeholder="Email"
              style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <input
              className="form-input"
              type="password"
              {...register('password')}
              placeholder="Contrasena"
              style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '11px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#111111',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading && <span className="spinner" />}
            Iniciar Sesion
          </button>
        </form>

        <p className="auth-footer">
          No tienes cuenta?{' '}
          <Link to="/register" style={{ color: '#111', fontWeight: 500 }}>Crea una</Link>
        </p>
      </div>
    </div>
  );
}