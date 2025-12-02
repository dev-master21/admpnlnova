// frontend/src/modules/Auth/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Image,
  Stack,
  Box,
  Center,
  ThemeIcon,
  Group,
  Text,
  Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  IconUser, 
  IconLock, 
  IconCheck, 
  IconX,
  IconLogin,
  IconShieldCheck
} from '@tabler/icons-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore, User } from '@/store/authStore';
import { useMediaQuery } from '@mantine/hooks';

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm<LoginFormData>({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? t('validation.required') : null),
      password: (value) => (!value ? t('validation.required') : null),
    },
  });

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(values);
      
      // Сохраняем токены
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Маппим данные пользователя в нужный формат
      const apiUser: any = data.data.user;
      
      const user: User = {
        id: apiUser.id,
        username: apiUser.username,
        full_name: apiUser.full_name,
        email: apiUser.email || null,
        is_active: apiUser.is_active !== undefined ? apiUser.is_active : true,
        is_super_admin: apiUser.is_super_admin || false,
        roles: Array.isArray(apiUser.roles) ? apiUser.roles.map((role: any) => ({
          id: role.id || 0,
          role_name: role.role_name || role,
          permissions: Array.isArray(role.permissions) ? role.permissions : []
        })) : []
      };
      
      // Сохраняем пользователя в store
      setAuth(user);
      
      notifications.show({
        title: t('auth.loginSuccess'),
        message: '',
        color: 'teal',
        icon: <IconCheck size={18} />,
        autoClose: 3000,
      });
      
      navigate('/');
    } catch (error: any) {
      notifications.show({
        title: t('auth.loginError'),
        message: error.response?.data?.message || '',
        color: 'red',
        icon: <IconX size={18} />,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#141414',
        padding: isMobile ? '20px' : '40px',
      }}
    >
      <Container size={440}>
        <Paper
          shadow="sm"
          radius="md"
          p={isMobile ? 'xl' : 40}
          withBorder
          style={{
            background: '#1f1f1f',
            borderColor: '#303030',
          }}
        >
          <Stack gap="lg">
            {/* Логотип и заголовок */}
            <Center>
              <Stack gap="md" align="center">
                <ThemeIcon
                  size={80}
                  radius="md"
                  variant="light"
                  color="blue"
                  style={{
                    background: 'rgba(66, 153, 225, 0.1)',
                  }}
                >
                  <Image
                    src="/logo.svg"
                    alt="NOVA ESTATE"
                    h={50}
                    w={50}
                    fit="contain"
                    style={{
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                </ThemeIcon>
                
                <Title
                  order={2}
                  ta="center"
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: isMobile ? '24px' : '28px',
                  }}
                >
                  {t('auth.login')}
                </Title>
              </Stack>
            </Center>

            <Divider />

            {/* Форма */}
            <form onSubmit={form.onSubmit(handleLogin)}>
              <Stack gap="md">
                <TextInput
                  label={
                    <Group gap={4}>
                      <Text size="sm" fw={500} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {t('auth.username')}
                      </Text>
                    </Group>
                  }
                  placeholder={t('auth.username')}
                  leftSection={
                    <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                      <IconUser size={16} />
                    </ThemeIcon>
                  }
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      fontSize: '16px',
                      background: '#141414',
                      borderColor: '#434343',
                      color: 'rgba(255, 255, 255, 0.85)',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover': {
                        borderColor: '#177ddc',
                      },
                      '&:focus': {
                        borderColor: '#177ddc',
                        boxShadow: '0 0 0 2px rgba(23, 125, 220, 0.2)',
                      },
                    },
                  }}
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label={
                    <Group gap={4}>
                      <Text size="sm" fw={500} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {t('auth.password')}
                      </Text>
                    </Group>
                  }
                  placeholder={t('auth.password')}
                  leftSection={
                    <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                      <IconLock size={16} />
                    </ThemeIcon>
                  }
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      fontSize: '16px',
                      background: '#141414',
                      borderColor: '#434343',
                      color: 'rgba(255, 255, 255, 0.85)',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover': {
                        borderColor: '#177ddc',
                      },
                      '&:focus': {
                        borderColor: '#177ddc',
                        boxShadow: '0 0 0 2px rgba(23, 125, 220, 0.2)',
                      },
                    },
                  }}
                  {...form.getInputProps('password')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  radius="md"
                  loading={loading}
                  loaderProps={{ type: 'dots' }}
                  leftSection={<IconLogin size={20} />}
                  style={{
                    marginTop: '10px',
                  }}
                >
                  {t('auth.login')}
                </Button>
              </Stack>
            </form>

            <Divider />

            {/* Нижняя информация */}
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'rgba(66, 153, 225, 0.05)',
                border: '1px solid rgba(66, 153, 225, 0.15)',
              }}
            >
              <Group gap="xs">
                <ThemeIcon size="sm" radius="xl" variant="light" color="blue">
                  <IconShieldCheck size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  {t('auth.secureLogin') || 'Защищённый вход в систему'}
                </Text>
              </Group>
            </Paper>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;