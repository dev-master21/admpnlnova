// frontend/src/modules/Properties/components/TranslationsEditor.tsx
import React, { useState } from 'react';
import {
  Card,
  Stack,
  Textarea,
  Button,
  Group,
  Text,
  Collapse,
  ThemeIcon,
  Box
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconLanguage,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface TranslationsEditorProps {
  viewMode?: boolean;
  form?: any; // Добавили проп для формы
}

const TranslationsEditor: React.FC<TranslationsEditorProps> = ({ viewMode = false, form }) => {
  const { t } = useTranslation();

  // Русский открыт по умолчанию, остальные закрыты
  const [openedLanguages, setOpenedLanguages] = useState<Record<string, boolean>>({
    ru: true,
    en: false,
    th: false,
    zh: false,
    he: false
  });

  const toggleLanguage = (lang: string) => {
    setOpenedLanguages(prev => ({
      ...prev,
      [lang]: !prev[lang]
    }));
  };

  const languages = [
    {
      code: 'ru',
      name: t('translationsEditor.languages.russian') || 'Русский',
      placeholder: t('translationsEditor.placeholders.ru') || 'Введите описание на русском языке...',
      color: 'blue',
      dir: 'ltr',
      isPriority: true
    },
    {
      code: 'en',
      name: t('translationsEditor.languages.english') || 'English',
      placeholder: t('translationsEditor.placeholders.en') || 'Enter description in English...',
      color: 'cyan',
      dir: 'ltr',
      isPriority: false
    },
    {
      code: 'th',
      name: t('translationsEditor.languages.thai') || 'ไทย',
      placeholder: t('translationsEditor.placeholders.th') || 'ใส่คำอธิบายเป็นภาษาไทย...',
      color: 'grape',
      dir: 'ltr',
      isPriority: false
    },
    {
      code: 'zh',
      name: t('translationsEditor.languages.chinese') || '中文',
      placeholder: t('translationsEditor.placeholders.zh') || '输入中文描述...',
      color: 'red',
      dir: 'ltr',
      isPriority: false
    },
    {
      code: 'he',
      name: t('translationsEditor.languages.hebrew') || 'עברית',
      placeholder: t('translationsEditor.placeholders.he') || 'הזן תיאור בעברית...',
      color: 'violet',
      dir: 'rtl',
      isPriority: false
    }
  ];

  const getCharacterCount = (lang: string) => {
    const value = form?.values?.translations?.[lang]?.description || '';
    return value.length;
  };

  return (
    <Stack gap="md">
      {languages.map((lang) => {
        const isOpened = openedLanguages[lang.code];
        const charCount = getCharacterCount(lang.code);
        
        return (
          <Card
            key={lang.code}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              borderColor: isOpened ? `var(--mantine-color-${lang.color}-6)` : undefined,
              borderWidth: isOpened ? 2 : 1
            }}
          >
            <Stack gap="md">
              {/* Header */}
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color={lang.color}>
                    <IconLanguage size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="lg">
                      {lang.name}
                    </Text>
                    {charCount > 0 && (
                      <Text size="xs" c="dimmed">
                        {charCount} {t('translationsEditor.characters') || 'символов'}
                      </Text>
                    )}
                  </Box>
                </Group>

                <Button
                  variant={isOpened ? 'light' : 'filled'}
                  color={lang.color}
                  size="sm"
                  leftSection={isOpened ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  rightSection={
                    isOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
                  }
                  onClick={() => toggleLanguage(lang.code)}
                >
                  {isOpened 
                    ? (t('common.hide') || 'Скрыть')
                    : (t('common.view') || 'Просмотреть')
                  }
                </Button>
              </Group>

              {/* Content */}
              <Collapse in={isOpened}>
                <Textarea
                  label={t('properties.description')}
                  placeholder={lang.placeholder}
                  minRows={lang.isPriority ? 12 : 8}
                  maxRows={lang.isPriority ? 20 : 15}
                  autosize
                  disabled={viewMode}
                  dir={lang.dir}
                  {...(form ? form.getInputProps(`translations.${lang.code}.description`) : {})}
                  styles={{
                    input: { 
                      fontSize: '16px',
                      lineHeight: 1.6
                    }
                  }}
                  description={
                    !viewMode && lang.isPriority
                      ? (t('translationsEditor.priorityDescription') || 'Основное описание, заполните максимально подробно')
                      : undefined
                  }
                />
              </Collapse>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
};

export default TranslationsEditor;