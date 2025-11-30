// frontend/src/modules/Properties/components/OwnerInfoModal.tsx
import { 
  Modal, 
  Stack, 
  Group, 
  Text, 
  Card, 
  ThemeIcon, 
  ActionIcon,
  Divider,
  Paper,
  Anchor,
  Center,
  Box
} from '@mantine/core';
import { 
  IconUser, 
  IconPhone, 
  IconMail, 
  IconBrandTelegram, 
  IconBrandInstagram,
  IconNotes,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconInfoCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';

interface OwnerInfoModalProps {
  visible: boolean;
  onClose: () => void;
  ownerData: {
    owner_name?: string;
    owner_phone?: string;
    owner_email?: string;
    owner_telegram?: string;
    owner_instagram?: string;
    owner_notes?: string;
  } | null;
}

const OwnerInfoModal = ({ visible, onClose, ownerData }: OwnerInfoModalProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    notifications.show({
      title: t('common.success'),
      message: t('common.copiedToClipboard'),
      color: 'green',
      icon: <IconCheck size={18} />
    });
    
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  if (!ownerData) {
    return (
      <Modal
        opened={visible}
        onClose={onClose}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              <IconUser size={20} stroke={1.5} />
            </ThemeIcon>
            <Text fw={600}>{t('properties.ownerInfo')}</Text>
          </Group>
        }
        size={isMobile ? 'full' : 'md'}
        centered
      >
        <Center p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="xl" variant="light" color="gray">
              <IconInfoCircle size={40} stroke={1.5} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">{t('properties.noOwnerInfo')}</Text>
          </Stack>
        </Center>
      </Modal>
    );
  }

  const hasAnyInfo = ownerData.owner_name || ownerData.owner_phone || ownerData.owner_email || 
                      ownerData.owner_telegram || ownerData.owner_instagram || ownerData.owner_notes;

  const infoFields = [
    {
      key: 'name',
      value: ownerData.owner_name,
      label: t('properties.ownerName'),
      icon: IconUser,
      color: 'blue',
      copyable: true,
      render: (value: string) => <Text fw={600} size="md">{value}</Text>
    },
    {
      key: 'phone',
      value: ownerData.owner_phone,
      label: t('properties.ownerPhone'),
      icon: IconPhone,
      color: 'green',
      copyable: true,
      render: (value: string) => (
        <Anchor href={`tel:${value}`} target="_blank" size="sm" c="green">
          {value}
        </Anchor>
      )
    },
    {
      key: 'email',
      value: ownerData.owner_email,
      label: t('properties.ownerEmail'),
      icon: IconMail,
      color: 'orange',
      copyable: true,
      render: (value: string) => (
        <Anchor href={`mailto:${value}`} target="_blank" size="sm" c="orange">
          {value}
        </Anchor>
      )
    },
    {
      key: 'telegram',
      value: ownerData.owner_telegram,
      label: t('properties.ownerTelegram'),
      icon: IconBrandTelegram,
      color: 'cyan',
      copyable: true,
      render: (value: string) => (
        <Group gap="xs">
          <Anchor 
            href={`https://t.me/${value.replace('@', '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            size="sm"
            c="cyan"
          >
            {value}
          </Anchor>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="cyan"
            component="a"
            href={`https://t.me/${value.replace('@', '')}`}
            target="_blank"
          >
            <IconExternalLink size={14} />
          </ActionIcon>
        </Group>
      )
    },
    {
      key: 'instagram',
      value: ownerData.owner_instagram,
      label: t('properties.ownerInstagram'),
      icon: IconBrandInstagram,
      color: 'pink',
      copyable: true,
      render: (value: string) => (
        <Group gap="xs">
          <Anchor 
            href={`https://instagram.com/${value.replace('@', '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            size="sm"
            c="pink"
          >
            {value}
          </Anchor>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="pink"
            component="a"
            href={`https://instagram.com/${value.replace('@', '')}`}
            target="_blank"
          >
            <IconExternalLink size={14} />
          </ActionIcon>
        </Group>
      )
    },
    {
      key: 'notes',
      value: ownerData.owner_notes,
      label: t('properties.ownerNotes'),
      icon: IconNotes,
      color: 'violet',
      copyable: true,
      fullWidth: true,
      render: (value: string) => (
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} c="dimmed">
          {value}
        </Text>
      )
    }
  ];

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconUser size={20} stroke={1.5} />
          </ThemeIcon>
          <div>
            <Text fw={600}>{t('properties.ownerInfo')}</Text>
            {ownerData.owner_name && (
              <Text size="xs" c="dimmed">{ownerData.owner_name}</Text>
            )}
          </div>
        </Group>
      }
      size={isMobile ? 'full' : 'md'}
      centered
    >
      {hasAnyInfo ? (
        <Stack gap="md">
          {infoFields.map((field) => {
            if (!field.value) return null;

            const Icon = field.icon;
            const isCopied = copiedField === field.key;

            return (
              <Card 
                key={field.key} 
                shadow="sm" 
                padding="md" 
                radius="md" 
                withBorder
                style={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(${field.color === 'blue' ? '59, 130, 246' : field.color === 'green' ? '34, 197, 94' : field.color === 'orange' ? '251, 146, 60' : field.color === 'cyan' ? '6, 182, 212' : field.color === 'pink' ? '236, 72, 153' : '139, 92, 246'}, 0.15)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon size="lg" radius="md" variant="light" color={field.color}>
                      <Icon size={20} stroke={1.5} />
                    </ThemeIcon>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" c="dimmed" mb={4}>
                        {field.label}
                      </Text>
                      <Box style={{ wordBreak: 'break-word' }}>
                        {field.render(field.value)}
                      </Box>
                    </div>
                  </Group>

                  {field.copyable && (
                    <ActionIcon
                      variant="subtle"
                      color={isCopied ? 'green' : field.color}
                      onClick={() => handleCopy(field.value!, field.key)}
                      style={{
                        transition: 'transform 0.2s'
                      }}
                    >
                      {isCopied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            );
          })}

          <Divider />

          <Paper p="sm" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
            <Group gap="xs">
              <IconInfoCircle size={16} />
              <Text size="xs" c="dimmed">
                {t('properties.ownerInfoHint') || 'Нажмите на иконку копирования, чтобы скопировать значение'}
              </Text>
            </Group>
          </Paper>
        </Stack>
      ) : (
        <Center p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="xl" variant="light" color="gray">
              <IconInfoCircle size={40} stroke={1.5} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">{t('properties.noOwnerInfo')}</Text>
          </Stack>
        </Center>
      )}
    </Modal>
  );
};

export default OwnerInfoModal;