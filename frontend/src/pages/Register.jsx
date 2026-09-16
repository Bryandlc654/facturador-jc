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
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

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
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Regístrate para empezar a facturar</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" {...register('nombre')} placeholder="Juan" />
                {errors.nombre && <p className="form-error">{errors.nombre.message}</p>}
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input className="form-input" {...register('apellido')} placeholder="Pérez" />
                {errors.apellido && <p className="form-error">{errors.apellido.message}</p>}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" {...register('email')} placeholder="tu@email.com" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <input className="form-input" type="password" {...register('confirmPassword')} placeholder="••••••••" />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Crear Cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
