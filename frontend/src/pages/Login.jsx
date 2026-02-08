import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
    // --- STAVY PRO STANDARDNÍ LOGIN ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Zde se drží původní/dočasné heslo
    const [error, setError] = useState('');
    
    // --- STAVY PRO ZMĚNU HESLA ---
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [tempToken, setTempToken] = useState(null); // Dočasně drží token
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const { login, changePassword } = useAuth(); // Nová funkce
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(email, password);

        if (result.success) {
            if (result.needsPasswordChange) {
                // 1. Musí změnit heslo: Zobrazíme druhý formulář
                setIsChangingPassword(true);
                setTempToken(result.tempToken); 
                // Heslo PONECHÁME ve stavu `password` pro ověření!
            } else {
                // 2. Standardní přihlášení
                console.log("Přihlášeno!");
                navigate('/admin');
            }
        } else {
            setError(result.error);
        }
    };
    
    // --- FUNKCE: ODESLÁNÍ ZMĚNY HESLA ---
    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError(t('login.password_mismatch'));
            return;
        }
        
        // POZOR: Původní heslo je ve stavu 'password'
        const oldPassword = password; 

        try {
            // Volání API pro změnu hesla s dočasným tokenem
            const success = await changePassword(tempToken, oldPassword, newPassword);

            if (success) {
                // Po úspěšné změně se PŘIHLÁSÍME NOVÝM HESLEM
                await login(email, newPassword);
                navigate('/admin');
            } else {
                // Nastala chyba (pravděpodobně špatné původní heslo)
                 setError(t('login.old_password_error')); 
            }
        } catch (err) {
            setError(t('login.generic_error'));
        }
    };


    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">
                    {t(isChangingPassword ? 'login.change_required_title' : 'login.title')}
                </h1>
                
                {error && <div className="error-msg">{error}</div>}

                {/* --- PODMÍNĚNÉ ZOBRAZENÍ FORMULÁŘE --- */}
                
                {isChangingPassword ? (
                    // --- FORMULÁŘ PRO ZMĚNU HESLA ---
                    <form onSubmit={handleChangePasswordSubmit}>
                        <p className="info-msg">{t('login.change_info')}</p>
                        
                        {/* STARÉ HESLO (input s hodnotou ze stavu 'password') */}
                        <Input 
                            label={t('login.old_password_label')} 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {/* NOVÉ HESLO */}
                        <Input 
                            label={t('login.new_password_label')} 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        
                        {/* POTVRZENÍ NOVÉHO HESLA */}
                        <Input 
                            label={t('login.confirm_password_label')} 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <Button type="submit">
                            {t('login.change_submit_btn')}
                        </Button>
                    </form>

                ) : (
                    // --- STANDARDNÍ LOGIN FORMULÁŘ ---
                    <form onSubmit={handleSubmit}>
                        <Input 
                            label={t('login.email_label')} 
                            type="email" 
                            placeholder="admin@firma.cz"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input 
                            label={t('login.password_label')} 
                            type="password" 
                            placeholder="******"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit">
                            {t('login.submit_btn')}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;