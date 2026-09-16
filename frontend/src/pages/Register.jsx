import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../lib/api.js';
import useAuthStore from '../store/auth.js';

const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio'),
  apellido: yup.string().required('El apellido es obligatorio'),
  email: yup.string().email('Email invalido').required('El email es obligatorio'),
  password: yup.string().min(6, 'Minimo 6 caracteres').required('La contrasena es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Las contrasenas no coinciden')
    .required('Confirma tu contrasena'),
});

const inputStyle = { background: '#f7f7f7', border: '1px solid #e5e5e5' };

export default function Register() {
  const navigate = useNavigate();
  const registerAuth = useAuthStore((s) => s.register);
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
      const { confirmPassword, ...payload } = data;
      const res = await api.post('/auth/register', payload);
      registerAuth(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: 32 }}>
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">Registrate para empezar a facturar</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <input className="form-input" {...register('nombre')} placeholder="Nombre" style={inputStyle} />
                {errors.nombre && <p className="form-error">{errors.nombre.message}</p>}
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <input className="form-input" {...register('apellido')} placeholder="Apellido" style={inputStyle} />
                {errors.apellido && <p className="form-error">{errors.apellido.message}</p>}
              </div>
            </div>
          </div>
          <div className="form-group">
            <input className="form-input" type="email" {...register('email')} placeholder="Email" style={inputStyle} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <input className="form-input" type="password" {...register('password')} placeholder="Contrasena" style={inputStyle} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div className="form-group">
            <input className="form-input" type="password" {...register('confirmPassword')} placeholder="Confirmar contrasena" style={inputStyle} />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
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
            Crear Cuenta
          </button>
        </form>

        <p className="auth-footer">
          Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#111', fontWeight: 500 }}>Inicia sesion</Link>
        </p>
      </div>
    </div>
  );
}