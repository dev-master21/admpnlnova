// frontend/src/modules/Dashboard/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  SimpleGrid,
  Group,
  Text,
  Paper,
  Stack,
  Button,
  Badge,
  ThemeIcon,
  Title,
  Box,
  Avatar,
  Progress,
  Timeline,
  useMantineColorScheme,
  Loader,
  Center,
  RingProgress
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconHome,
  IconEye,
  IconFileText,
  IconEyeOff,
  IconPlus,
  IconArrowRight,
  IconTrendingUp,
  IconUsers,
  IconCalendar,
  IconChartBar,
  IconSparkles,
  IconBuilding,
  IconClock
} from '@tabler/icons-react';
import { propertiesApi, Property } from '@/api/properties.api';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    hidden: 0
  });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем недавние объекты
      const { data } = await propertiesApi.getAll({ page: 1, limit: 5 });
      setRecentProperties(data.data.properties);

      // Подсчитываем статистику
      const total = data.data.pagination.total;
      
      // Загружаем статистику по статусам
      const [publishedRes, draftRes, hiddenRes] = await Promise.all([
        propertiesApi.getAll({ status: 'published', limit: 1 }),
        propertiesApi.getAll({ status: 'draft', limit: 1 }),
        propertiesApi.getAll({ status: 'hidden', limit: 1 })
      ]);

      setStats({
        total,
        published: publishedRes.data.data.pagination.total,
        draft: draftRes.data.data.pagination.total,
        hidden: hiddenRes.data.data.pagination.total
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusGradient = (status: string) => {
    const gradients: Record<string, { from: string; to: string }> = {
      published: { from: 'teal', to: 'green' },
      draft: { from: 'yellow', to: 'orange' },
      hidden: { from: 'orange', to: 'red' },
      archived: { from: 'red', to: 'pink' }
    };
    return gradients[status] || { from: 'gray', to: 'dark' };
  };

  const statsCards = [
    {
      title: t('dashboard.stats.totalProperties'),
      value: stats.total,
      icon: IconHome,
      gradient: { from: 'violet', to: 'grape' },
      color: 'violet'
    },
    {
      title: t('dashboard.stats.publishedProperties'),
      value: stats.published,
      icon: IconEye,
      gradient: { from: 'teal', to: 'green' },
      color: 'teal'
    },
    {
      title: t('dashboard.stats.draftProperties'),
      value: stats.draft,
      icon: IconFileText,
      gradient: { from: 'yellow', to: 'orange' },
      color: 'yellow'
    },
    {
      title: t('dashboard.stats.hiddenProperties'),
      value: stats.hidden,
      icon: IconEyeOff,
      gradient: { from: 'orange', to: 'red' },
      color: 'orange'
    }
  ];

  if (loading) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" variant="dots" />
          <Text size="lg" c="dimmed">Загрузка данных...</Text>
        </Stack>
      </Center>
    );
  }

  const publishedPercentage = stats.total > 0 
    ? Math.round((stats.published / stats.total) * 100) 
    : 0;

  return (
    <Stack gap="lg">
      {/* Welcome Header */}
      <Card
        shadow="sm"
        padding="xl"
        radius="md"
        style={{
          background: colorScheme === 'dark'
            ? 'linear-gradient(135deg, #7950F2 0%, #9775FA 100%)'
            : 'linear-gradient(135deg, #7950F2 0%, #9775FA 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)'
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(30px)'
          }}
        />
        
        <Group justify="space-between" wrap="wrap" style={{ position: 'relative' }}>
          <Stack gap="xs">
            <Group gap="sm">
              <Avatar
                size={isMobile ? 48 : 64}
                radius="xl"
                variant="white"
                color="violet"
              >
                <IconSparkles size={isMobile ? 24 : 32} stroke={1.5} />
              </Avatar>
              <Stack gap={0}>
                <Title order={isMobile ? 3 : 2} c="white">
                  {t('dashboard.welcome')}, {user?.full_name}!
                </Title>
                <Text size={isMobile ? 'sm' : 'md'} c="rgba(255, 255, 255, 0.9)">
                  {dayjs().format('dddd, D MMMM YYYY')}
                </Text>
              </Stack>
            </Group>
          </Stack>

          {!isMobile && (
            <Group gap="sm">
              {hasPermission('properties.create') && (
                <Button
                  size="lg"
                  variant="white"
                  color="violet"
                  leftSection={<IconPlus size={20} />}
                  onClick={() => navigate('/properties/create')}
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {t('nav.addProperty')}
                </Button>
              )}
            </Group>
          )}
        </Group>
      </Card>

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 4 }} spacing="md">
        {statsCards.map((stat, index) => (
          <Paper
            key={index}
            shadow="sm"
            p="lg"
            radius="md"
            withBorder
            style={{
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(121, 80, 242, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
            onClick={() => navigate('/properties')}
          >
            <Group justify="space-between" mb="xs">
              <ThemeIcon
                size={60}
                radius="md"
                variant="gradient"
                gradient={stat.gradient}
              >
                <stat.icon size={32} stroke={1.5} />
              </ThemeIcon>
            </Group>
            
            <Text size="xl" fw={700} mt="md">
              {stat.value}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {stat.title}
            </Text>

            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, var(--mantine-color-${stat.color}-6), var(--mantine-color-${stat.color}-4))`
              }}
            />
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {/* Recent Properties */}
        <Box style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <IconClock size={20} stroke={1.5} />
                </ThemeIcon>
                <Title order={4}>{t('dashboard.recentProperties')}</Title>
              </Group>
              {hasPermission('properties.read') && (
                <Button
                  variant="subtle"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={() => navigate('/properties')}
                >
                  {t('common.view')}
                </Button>
              )}
            </Group>

            <Stack gap="md">
              {recentProperties.length === 0 ? (
                <Paper p="xl" radius="md" withBorder>
                  <Stack align="center" gap="sm">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                      <IconHome size={30} stroke={1.5} />
                    </ThemeIcon>
                    <Text c="dimmed">{t('common.noData')}</Text>
                  </Stack>
                </Paper>
              ) : (
                <Timeline active={recentProperties.length} bulletSize={24} lineWidth={2}>
                  {recentProperties.map((property) => (
                    <Timeline.Item
                      key={property.id}
                      bullet={<IconBuilding size={12} />}
                      title={
                        <Group gap="xs" wrap="wrap">
                          <Text fw={600} size="sm">
                            {property.property_number}
                          </Text>
                          <Badge
                            variant="gradient"
                            gradient={getStatusGradient(property.status)}
                            size="sm"
                          >
                            {t(`properties.statuses.${property.status}`)}
                          </Badge>
                        </Group>
                      }
                    >
                      <Stack gap="xs" mt={4}>
                        <Text size="sm" c="dimmed">
                          {property.property_name || t('common.noData')}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <Text size="xs" c="dimmed">
                            <IconUsers size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {property.creator_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            <IconCalendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {dayjs(property.created_at).format('DD.MM.YYYY')}
                          </Text>
                        </Group>
                        {property.sale_price && (
                          <Text size="sm" fw={700} c="violet">
                            {property.sale_price.toLocaleString()} ฿
                          </Text>
                        )}
                        <Group gap="xs" mt="xs">
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => navigate(`/properties/edit/${property.id}`)}
                          >
                            {t('common.edit')}
                          </Button>
                        </Group>
                      </Stack>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Stack>
          </Card>
        </Box>

        {/* Quick Actions & Stats */}
        <Stack gap="lg">
          {/* Quick Actions */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="sm" mb="lg">
              <ThemeIcon size="lg" radius="md" variant="light" color="grape">
                <IconChartBar size={20} stroke={1.5} />
              </ThemeIcon>
              <Title order={4}>{t('dashboard.quickActions')}</Title>
            </Group>

            <Stack gap="sm">
              {hasPermission('properties.create') && (
                <Button
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  leftSection={<IconPlus size={18} />}
                  fullWidth
                  size="md"
                  onClick={() => navigate('/properties/create')}
                >
                  {t('nav.addProperty')}
                </Button>
              )}
              {hasPermission('properties.read') && (
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconHome size={18} />}
                  fullWidth
                  size="md"
                  onClick={() => navigate('/properties')}
                >
                  {t('nav.propertiesList')}
                </Button>
              )}
              {hasPermission('users.create') && (
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<IconUsers size={18} />}
                  fullWidth
                  size="md"
                  onClick={() => navigate('/users/create')}
                >
                  {t('nav.addUser')}
                </Button>
              )}
            </Stack>
          </Card>

          {/* Publishing Progress */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="sm" mb="lg">
              <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                <IconTrendingUp size={20} stroke={1.5} />
              </ThemeIcon>
              <Title order={4}>Статистика публикаций</Title>
            </Group>

            <Stack gap="lg">
              <Center>
                <RingProgress
                  size={180}
                  thickness={16}
                  roundCaps
                  sections={[
                    {
                      value: publishedPercentage,
                      color: 'teal',
                      tooltip: `Опубликовано: ${stats.published}`
                    },
                    {
                      value: stats.draft > 0 ? (stats.draft / stats.total) * 100 : 0,
                      color: 'yellow',
                      tooltip: `Черновики: ${stats.draft}`
                    },
                    {
                      value: stats.hidden > 0 ? (stats.hidden / stats.total) * 100 : 0,
                      color: 'orange',
                      tooltip: `Скрыто: ${stats.hidden}`
                    }
                  ]}
                  label={
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>
                        {publishedPercentage}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        опубликовано
                      </Text>
                    </Stack>
                  }
                />
              </Center>

              <Stack gap="xs">
                <Group justify="space-between">
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: 'var(--mantine-color-teal-6)'
                      }}
                    />
                    <Text size="sm">Опубликовано</Text>
                  </Group>
                  <Text size="sm" fw={600}>{stats.published}</Text>
                </Group>
                <Progress value={publishedPercentage} color="teal" size="sm" />

                <Group justify="space-between" mt="xs">
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: 'var(--mantine-color-yellow-6)'
                      }}
                    />
                    <Text size="sm">Черновики</Text>
                  </Group>
                  <Text size="sm" fw={600}>{stats.draft}</Text>
                </Group>
                <Progress
                  value={stats.total > 0 ? (stats.draft / stats.total) * 100 : 0}
                  color="yellow"
                  size="sm"
                />

                <Group justify="space-between" mt="xs">
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        backgroundColor: 'var(--mantine-color-orange-6)'
                      }}
                    />
                    <Text size="sm">Скрыто</Text>
                  </Group>
                  <Text size="sm" fw={600}>{stats.hidden}</Text>
                </Group>
                <Progress
                  value={stats.total > 0 ? (stats.hidden / stats.total) * 100 : 0}
                  color="orange"
                  size="sm"
                />
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
};

export default Dashboard;