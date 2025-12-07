import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/f5ce10ba-aa37-425d-9e8a-b007ef32afd1';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewPasswordConfirm, setResetNewPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetCode, setShowResetCode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: 'Успешный вход',
          description: `Добро пожаловать, ${data.user.full_name}!`
        });
        navigate('/');
      } else {
        toast({
          title: 'Ошибка входа',
          description: data.error || 'Неверные данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerPasswordConfirm) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен содержать минимум 6 символов',
        variant: 'destructive'
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: registerEmail,
          phone: registerPhone,
          full_name: registerFullName,
          password: registerPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowVerification(true);
        toast({
          title: 'Регистрация отправлена',
          description: data.email_sent 
            ? 'Код подтверждения отправлен на email' 
            : 'Проверьте настройки SMTP для отправки email'
        });
      } else {
        toast({
          title: 'Ошибка регистрации',
          description: data.error || 'Не удалось зарегистрироваться',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: registerEmail,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Email подтвержден',
          description: 'Теперь вы можете войти в систему'
        });
        setShowVerification(false);
        setRegisterEmail('');
        setRegisterPhone('');
        setRegisterFullName('');
        setRegisterPassword('');
        setRegisterPasswordConfirm('');
        setVerificationCode('');
      } else {
        toast({
          title: 'Ошибка верификации',
          description: data.error || 'Неверный код',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password_request',
          email: resetEmail
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowResetCode(true);
        toast({
          title: 'Код отправлен',
          description: data.email_sent 
            ? 'Проверьте почту для получения кода' 
            : 'Проверьте настройки SMTP'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetNewPassword !== resetNewPasswordConfirm) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    if (resetNewPassword.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен содержать минимум 6 символов',
        variant: 'destructive'
      });
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: resetEmail,
          code: resetCode,
          new_password: resetNewPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Пароль изменен',
          description: 'Теперь вы можете войти с новым паролем'
        });
        setShowResetCode(false);
        setResetEmail('');
        setResetCode('');
        setResetNewPassword('');
        setResetNewPasswordConfirm('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить пароль',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Icon name="Ticket" size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">EventHub</h1>
          <p className="text-muted-foreground">Добро пожаловать на платформу билетов</p>
        </div>

        <Card className="p-6 animate-scale-in">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                      Вход...
                    </>
                  ) : (
                    <>
                      <Icon name="LogIn" className="mr-2" size={18} />
                      Войти
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    const tabsList = document.querySelector('[role="tablist"]');
                    const resetTab = document.querySelector('[value="reset"]') as HTMLElement;
                    if (resetTab) resetTab.click();
                  }}
                >
                  Забыли пароль?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {!showVerification ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-fullname">ФИО</Label>
                    <Input
                      id="register-fullname"
                      type="text"
                      placeholder="Иван Иванов"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Номер телефона</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+7 999 123-45-67"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">Повторите пароль</Label>
                    <Input
                      id="register-password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerPasswordConfirm}
                      onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={registerLoading}>
                    {registerLoading ? (
                      <>
                        <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                        Регистрация...
                      </>
                    ) : (
                      <>
                        <Icon name="UserPlus" className="mr-2" size={18} />
                        Зарегистрироваться
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerification} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="Mail" size={32} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Подтверждение email</h3>
                    <p className="text-sm text-muted-foreground">
                      Введите 4-значный код, отправленный на<br />
                      <strong>{registerEmail}</strong>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Код подтверждения</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="1234"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-widest"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={verificationLoading}>
                    {verificationLoading ? (
                      <>
                        <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                        Проверка...
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircle" className="mr-2" size={18} />
                        Подтвердить
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowVerification(false)}
                  >
                    Вернуться назад
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6 mt-4 animate-scale-in">
          <Tabs value="reset" className="w-full">
            <div className="text-center mb-4">
              <h3 className="font-semibold">Восстановление пароля</h3>
            </div>
            {!showResetCode ? (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="mr-2" size={18} />
                      Отправить код
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-code">Код из email</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="1234"
                    maxLength={4}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-new-password">Новый пароль</Label>
                  <Input
                    id="reset-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-new-password-confirm">Повторите пароль</Label>
                  <Input
                    id="reset-new-password-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={resetNewPasswordConfirm}
                    onChange={(e) => setResetNewPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Icon name="Key" className="mr-2" size={18} />
                      Изменить пароль
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetCode(false)}
                >
                  Вернуться назад
                </Button>
              </form>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
