// frontend/src/modules/Properties/components/CalendarModal.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  ActionIcon,
  Button,
  Alert,
  Center,
  Loader,
  Box,
  SimpleGrid,
  Paper,
  ThemeIcon
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconInfoCircle,
  IconCalendar
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { propertiesApi } from '@/api/properties.api';
import dayjs from 'dayjs';

interface CalendarModalProps {
  propertyId: number;
  visible: boolean;
  onClose: () => void;
}

interface BlockedDate {
  blocked_date: string;
  reason: string | null;
  is_check_in?: number | boolean;
  is_check_out?: number | boolean;
}

const CalendarModal = ({ propertyId, visible, onClose }: CalendarModalProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [blockedDatesMap, setBlockedDatesMap] = useState<Map<string, BlockedDate>>(new Map());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());

  useEffect(() => {
    if (visible) {
      loadCalendar();
    }
  }, [visible, propertyId]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const { data: response } = await propertiesApi.getCalendar(propertyId);
      setData(response.data);

      const blockedMap = new Map<string, BlockedDate>();
      
      response.data.blocked_dates.forEach((item: BlockedDate) => {
        blockedMap.set(item.blocked_date, item);
      });

      response.data.bookings?.forEach((booking: any) => {
        const start = dayjs(booking.check_in_date);
        const end = dayjs(booking.check_out_date);
        
        let current = start;
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          const dateStr = current.format('YYYY-MM-DD');
          if (!blockedMap.has(dateStr)) {
            blockedMap.set(dateStr, {
              blocked_date: dateStr,
              reason: booking.guest_name || 'Booking',
              is_check_in: current.isSame(start, 'day') ? 1 : 0,
              is_check_out: current.isSame(end, 'day') ? 1 : 0
            });
          }
        }
      });

      setBlockedDatesMap(blockedMap);
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasCalendarData = data && (data.blocked_dates.length > 0 || data.bookings?.length > 0);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    setSelectedYear(dayjs().year());
    setSelectedMonth(dayjs().month());
  };

  const getCurrentMonthName = () => {
    return dayjs().year(selectedYear).month(selectedMonth).format('MMMM YYYY');
  };

  const generateCalendar = () => {
    const firstDay = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const lastDay = firstDay.endOf('month');
    const startDate = firstDay.startOf('week');
    const endDate = lastDay.endOf('week');

    const calendar = [];
    let currentWeek = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      currentWeek.push(current);
      
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
      
      current = current.add(1, 'day');
    }

    if (currentWeek.length > 0) {
      calendar.push(currentWeek);
    }

    return calendar;
  };

  const getDateStatus = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const blockedInfo = blockedDatesMap.get(dateStr);
    
    if (!blockedInfo) {
      return { blocked: false, checkIn: false, checkOut: false };
    }
    
    return {
      blocked: true,
      checkIn: Boolean(blockedInfo.is_check_in),
      checkOut: Boolean(blockedInfo.is_check_out)
    };
  };

  const isCurrentMonth = (date: dayjs.Dayjs) => {
    return date.month() === selectedMonth;
  };

  const weekDays = useMemo(() => {
    const days = t('calendarManager.weekDays', { returnObjects: true }) as string[];
    return days || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  }, [t]);

  const calendar = generateCalendar();

  const renderCalendarDay = (day: dayjs.Dayjs) => {
    const dateStr = day.format('YYYY-MM-DD');
    const status = getDateStatus(day);
    const current = isCurrentMonth(day);
    const today = day.isSame(dayjs(), 'day');

    let backgroundColor = 'transparent';
    let borderColor = '#2C2E33';
    let textColor = current ? '#C1C2C5' : '#5C5F66';
    let dayStyle: React.CSSProperties = {};

    if (today) {
      borderColor = '#228BE6';
      textColor = '#228BE6';
    }

    if (status.blocked) {
      if (status.checkIn && status.checkOut) {
        dayStyle = {
          background: 'linear-gradient(135deg, #C92A2A 0%, #C92A2A 50%, #862E9C 50%, #862E9C 100%)',
          position: 'relative'
        };
        textColor = '#FFFFFF';
        borderColor = '#FA5252';
      } else if (status.checkIn) {
        dayStyle = {
          background: 'linear-gradient(135deg, transparent 50%, #C92A2A 50%)',
          position: 'relative'
        };
        borderColor = '#FA5252';
      } else if (status.checkOut) {
        dayStyle = {
          background: 'linear-gradient(135deg, #C92A2A 0%, #C92A2A 50%, transparent 50%)',
          position: 'relative'
        };
        borderColor = '#FA5252';
      } else {
        backgroundColor = '#C92A2A';
        textColor = '#FFFFFF';
        borderColor = '#FA5252';
      }
    }

    return (
      <Box
        key={dateStr}
        style={{
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${borderColor}`,
          borderRadius: '8px',
          cursor: 'default',
          backgroundColor,
          minHeight: isMobile ? '45px' : '60px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 600,
          color: textColor,
          opacity: current ? 1 : 0.4,
          ...dayStyle
        }}
      >
        {day.date()}
      </Box>
    );
  };

  const CalendarLegend = () => (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={600}>{t('calendarManager.legend')}</Text>
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="xs">
          <Group gap={8}>
            <Box
              w={24}
              h={24}
              style={{
                border: '2px solid #228BE6',
                borderRadius: '4px',
                backgroundColor: 'transparent'
              }}
            />
            <Text size="xs">{t('calendarManager.today')}</Text>
          </Group>
          
          <Group gap={8}>
            <Box
              w={24}
              h={24}
              style={{
                backgroundColor: '#C92A2A',
                borderRadius: '4px',
                border: '2px solid #FA5252'
              }}
            />
            <Text size="xs">{t('calendarManager.occupied')}</Text>
          </Group>
          
          <Group gap={8}>
            <Box
              w={24}
              h={24}
              style={{
                background: 'linear-gradient(135deg, transparent 50%, #C92A2A 50%)',
                borderRadius: '4px',
                border: '2px solid #FA5252'
              }}
            />
            <Text size="xs">{t('calendarManager.checkIn')}</Text>
          </Group>
          
          <Group gap={8}>
            <Box
              w={24}
              h={24}
              style={{
                background: 'linear-gradient(135deg, #C92A2A 0%, #C92A2A 50%, transparent 50%)',
                borderRadius: '4px',
                border: '2px solid #FA5252'
              }}
            />
            <Text size="xs">{t('calendarManager.checkOut')}</Text>
          </Group>
          
          <Group gap={8}>
            <Box
              w={24}
              h={24}
              style={{
                background: 'linear-gradient(135deg, #C92A2A 0%, #C92A2A 50%, #862E9C 50%, #862E9C 100%)',
                borderRadius: '4px',
                border: '2px solid #FA5252'
              }}
            />
            <Text size="xs">{t('calendarManager.checkInOut')}</Text>
          </Group>
        </SimpleGrid>
      </Stack>
    </Paper>
  );

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
            <IconCalendar size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">{t('calendarManager.calendarModalTitle')}</Text>
        </Group>
      }
      size={isMobile ? 'full' : 'xl'}
      centered
    >
      {loading ? (
        <Center p={80}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">{t('common.loading')}</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="lg">
          {!hasCalendarData && (
            <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
              <Stack gap={4}>
                <Text size="sm" fw={500}>{t('calendarManager.noCalendarData')}</Text>
                <Text size="xs" c="dimmed">{t('calendarManager.noCalendarDataDesc')}</Text>
              </Stack>
            </Alert>
          )}

          {/* Навигация по месяцам */}
          <Group justify="space-between" wrap="wrap">
            <Group gap="xs">
              <ActionIcon
                variant="light"
                color="violet"
                onClick={goToPreviousMonth}
                size="lg"
              >
                <IconChevronLeft size={20} />
              </ActionIcon>
              <Text fw={600} size="lg" style={{ minWidth: isMobile ? '140px' : '180px', textAlign: 'center' }}>
                {getCurrentMonthName()}
              </Text>
              <ActionIcon
                variant="light"
                color="violet"
                onClick={goToNextMonth}
                size="lg"
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Group>

            <Button
              variant="light"
              color="gray"
              size="sm"
              onClick={goToToday}
            >
              {t('calendarManager.today')}
            </Button>
          </Group>

          {/* Сетка календаря */}
          <Box>
            {/* Дни недели */}
            <SimpleGrid cols={7} spacing={2} mb="xs">
              {weekDays.map((day) => (
                <Center key={day}>
                  <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                    {day}
                  </Text>
                </Center>
              ))}
            </SimpleGrid>

            {/* Дни месяца */}
            <Stack gap={2}>
              {calendar.map((week, weekIndex) => (
                <SimpleGrid key={weekIndex} cols={7} spacing={2}>
                  {week.map((day) => renderCalendarDay(day))}
                </SimpleGrid>
              ))}
            </Stack>
          </Box>

          {/* Легенда */}
          <CalendarLegend />

          {/* Кнопка закрытия */}
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              {t('common.close')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

export default CalendarModal;