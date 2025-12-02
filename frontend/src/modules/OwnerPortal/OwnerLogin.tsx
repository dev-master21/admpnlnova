// frontend/src/modules/OwnerPortal/OwnerLogin.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  PasswordInput,
  Button,
  Stack,
  Container,
  Title,
  Text,
  ThemeIcon,
  Group,
  Alert,
  Center,
  Loader,
  Box,
  Divider,
  Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconLock,
  IconHome,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconLogin,
  IconShieldCheck,
  IconUser,
  IconClock
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { propertyOwnersApi } from '@/api/propertyOwners.api';
import { useOwnerStore } from '@/store/ownerStore';

const OwnerLogin = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useOwnerStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [ownerData, setOwnerData] = useState<any>(null);

  const form = useForm({
    initialValues: {
      password: '',
    },
    validate: {
      password: (value) => (!value ? t('ownerPortal.passwordRequired') : null),
    },
  });

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    setVerifying(true);
    try {
      const { data } = await propertyOwnersApi.verifyToken(token!);
      if (data.success) {
        setTokenValid(true);
        setOwnerData(data.data);
      }
    } catch (error: any) {
      notifications.show({
        title: t('ownerPortal.invalidToken'),
        message: '',
        color: 'red',
        icon: <IconX size={18} />
      });
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (values: { password: string }) => {
    setLoading(true);
    try {
      const { data } = await propertyOwnersApi.login({
        access_token: token!,
        password: values.password
      });

      if (data.success) {
        setAuth(data.data.owner, data.data.accessToken, data.data.refreshToken);
        notifications.show({
          title: t('ownerPortal.loginSuccess'),
          message: '',
          color: 'teal',
          icon: <IconCheck size={18} />
        });
        navigate('/owner/dashboard');
      }
    } catch (error: any) {
      notifications.show({
        title: t('ownerPortal.loginError'),
        message: error.response?.data?.message || '',
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Состояние верификации токена
  if (verifying) {
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
        <Container size={500}>
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
            <Center>
              <Stack align="center" gap="lg">
                <ThemeIcon
                  size={80}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                >
                  <IconShieldCheck size={40} />
                </ThemeIcon>
                <Loader size="lg" variant="dots" />
                <Text c="dimmed" size="sm">{t('ownerPortal.verifying')}</Text>
              </Stack>
            </Center>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Невалидный токен
  if (!tokenValid) {
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
        <Container size={500}>
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
            <Stack align="center" gap="lg">
              <ThemeIcon
                size={100}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'red', to: 'pink' }}
              >
                <IconHome size={50} />
              </ThemeIcon>
              
              <Stack align="center" gap="xs">
                <Title order={3} ta="center" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  {t('ownerPortal.accessDenied')}
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  {t('ownerPortal.accessDeniedDescription')}
                </Text>
              </Stack>

              <Alert
                icon={<IconAlertCircle size={18} />}
                color="red"
                variant="light"
                w="100%"
              >
                <Text size="sm">{t('ownerPortal.invalidTokenMessage')}</Text>
              </Alert>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Форма логина
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
      <Container size={540}>
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
            {/* Заголовок */}
            <Center>
              <Stack gap="md" align="center">
                <ThemeIcon
                  size={90}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                >
                  <IconHome size={45} />
                </ThemeIcon>
                
                <Stack gap="xs" align="center">
                  <Title
                    order={2}
                    ta="center"
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: isMobile ? '24px' : '28px',
                    }}
                  >
                    {t('ownerPortal.welcome')}
                  </Title>
                  
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" variant="light" color="blue">
                      <IconUser size={12} />
                    </ThemeIcon>
                    <Text size="lg" fw={600} c="dimmed">
                      {ownerData?.owner_name}
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Center>

            <Divider />

            {/* Информация о владельце */}
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(121, 80, 242, 0.1) 0%, rgba(151, 117, 250, 0.1) 100%)',
                border: '1px solid rgba(121, 80, 242, 0.2)',
              }}
            >
              <Stack gap="sm">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                    <IconInfoCircle size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>{t('ownerPortal.loginInfo')}</Text>
                </Group>

                <Stack gap="xs" pl="md">
                  <Group gap="xs">
                    <ThemeIcon size="xs" radius="xl" variant="light" color="violet">
                      <IconHome size={10} />
                    </ThemeIcon>
                    <Text size="sm">
                      {t('ownerPortal.propertiesCount')}: <Badge size="sm" variant="filled" color="violet">{ownerData?.properties_count || 0}</Badge>
                    </Text>
                  </Group>

                  {ownerData?.last_login_at && (
                    <Group gap="xs">
                      <ThemeIcon size="xs" radius="xl" variant="light" color="cyan">
                        <IconClock size={10} />
                      </ThemeIcon>
                      <Text size="xs" c="dimmed">
                        {t('ownerPortal.lastLogin')}: {new Date(ownerData.last_login_at).toLocaleString()}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* Форма */}
            <form onSubmit={form.onSubmit(handleLogin)}>
              <Stack gap="md">
                <PasswordInput
                  label={
                    <Group gap={4}>
                      <Text size="sm" fw={500} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {t('ownerPortal.password')}
                      </Text>
                    </Group>
                  }
                  placeholder={t('ownerPortal.enterPassword')}
                  leftSection={
                    <ThemeIcon size="sm" variant="light" color="violet" radius="xl">
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
                        borderColor: '#7950F2',
                      },
                      '&:focus': {
                        borderColor: '#7950F2',
                        boxShadow: '0 0 0 2px rgba(121, 80, 242, 0.2)',
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
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  leftSection={<IconLogin size={20} />}
                  style={{
                    marginTop: '10px',
                  }}
                  styles={{
                    root: {
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(121, 80, 242, 0.4)',
                      },
                    },
                  }}
                >
                  {t('ownerPortal.login')}
                </Button>
              </Stack>
            </form>

            {/* Подсказка */}
            <Alert
              icon={<IconAlertCircle size={18} />}
              color="yellow"
              variant="light"
            >
              <Stack gap="xs">
                <Text size="sm" fw={500}>{t('ownerPortal.hint')}</Text>
                <Text size="xs" c="dimmed">{t('ownerPortal.hintText')}</Text>
              </Stack>
            </Alert>

            {/* Безопасность */}
            <Paper
              p="sm"
              radius="md"
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
              }}
            >
              <Group gap="xs">
                <ThemeIcon size="sm" radius="xl" variant="light" color="teal">
                  <IconShieldCheck size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  {t('ownerPortal.secureConnection') || 'Защищённое соединение'}
                </Text>
              </Group>
            </Paper>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default OwnerLogin;