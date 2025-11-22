import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('penjaga_outlet');
  const [password, setPassword] = useState('ginastel123');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
  const ok = await login(username, password);
    if (ok) {
      nav('/');
    } else {
      setError('Login gagal');
    }
  }

  return (
    <div className="login-wrapper">
      <form onSubmit={submit} className="login-form">
        <h2>Login Kasir</h2>
        <label>Username:</label>
        <input value={username} onChange={e => setUsername(e.target.value)} />
        <label>Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Masuk'}</button>
        {error && <div className="error">{error}</div>}
        <p>Bismillahirrahmanirrahim</p>
      </form>
    </div>
  );
};
export default LoginPage;
