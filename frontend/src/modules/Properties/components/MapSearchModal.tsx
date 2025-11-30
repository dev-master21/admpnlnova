// frontend/src/modules/Properties/components/MapSearchModal.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Slider,
  NumberInput,
  Stack,
  Group,
  Text,
  Card,
  Grid,
  ThemeIcon,
  Badge,
  Alert,
  TextInput,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconMapPin,
  IconSearch,
  IconCurrentLocation,
  IconAdjustments,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface Props {
  visible: boolean; // ✅ Исправлено: было opened
  onClose: () => void;
  onApply: (data: { lat: number; lng: number; radius_km: number }) => void;
  initialData?: {
    lat: number;
    lng: number;
    radius_km: number;
  };
}

const MapSearchModal = ({ visible, onClose, onApply, initialData }: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [center, setCenter] = useState({
    lat: initialData?.lat || 7.8804,
    lng: initialData?.lng || 98.3923
  });
  const [radiusKm, setRadiusKm] = useState(initialData?.radius_km || 5);
  const [markerPosition, setMarkerPosition] = useState(center);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  useEffect(() => {
    if (initialData) {
      setCenter({ lat: initialData.lat, lng: initialData.lng });
      setMarkerPosition({ lat: initialData.lat, lng: initialData.lng });
      setRadiusKm(initialData.radius_km);
    }
  }, [initialData]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCenter(newCenter);
          setMarkerPosition(newCenter);
          notifications.show({
            title: t('mapSearchModal.locationFound'),
            message: t('mapSearchModal.locationFoundDescription'),
            color: 'green',
            icon: <IconCheck size={16} />
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          notifications.show({
            title: t('mapSearchModal.locationError'),
            message: t('mapSearchModal.locationErrorDescription'),
            color: 'red',
            icon: <IconX size={16} />
          });
        }
      );
    } else {
      notifications.show({
        title: t('mapSearchModal.geolocationNotSupported'),
        message: t('mapSearchModal.geolocationNotSupportedDescription'),
        color: 'orange',
        icon: <IconInfoCircle size={16} />
      });
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      notifications.show({
        title: t('mapSearchModal.emptyAddress'),
        message: t('mapSearchModal.emptyAddressDescription'),
        color: 'orange',
        icon: <IconInfoCircle size={16} />
      });
      return;
    }

    setIsSearching(true);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchAddress });

      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng()
        };
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        notifications.show({
          title: t('mapSearchModal.addressFound'),
          message: result.results[0].formatted_address,
          color: 'green',
          icon: <IconCheck size={16} />
        });
      } else {
        notifications.show({
          title: t('mapSearchModal.addressNotFound'),
          message: t('mapSearchModal.addressNotFoundDescription'),
          color: 'orange',
          icon: <IconInfoCircle size={16} />
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      notifications.show({
        title: t('mapSearchModal.searchError'),
        message: t('mapSearchModal.searchErrorDescription'),
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = () => {
    if (!markerPosition) {
      notifications.show({
        title: t('mapSearchModal.noPointSelected'),
        message: t('mapSearchModal.selectPointOnMap'),
        color: 'orange',
        icon: <IconInfoCircle size={16} />
      });
      return;
    }

    onApply({
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      radius_km: radiusKm
    });

    notifications.show({
      title: t('mapSearchModal.applied'),
      message: t('mapSearchModal.mapSearchApplied', { radius: radiusKm }),
      color: 'green',
      icon: <IconCheck size={16} />
    });

    onClose();
  };

  const calculateArea = (radius: number) => {
    const area = Math.PI * radius * radius;
    return area.toFixed(2);
  };

  return (
    <Modal
      opened={visible} // ✅ Исправлено: используем visible
      onClose={onClose}
      size={isMobile ? 'full' : 'xl'}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconMapPin size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="lg">{t('mapSearchModal.title')}</Text>
            <Text size="xs" c="dimmed">{t('mapSearchModal.subtitle')}</Text>
          </div>
        </Group>
      }
      centered
      styles={{
        body: { padding: isMobile ? 12 : 24 }
      }}
    >
      <Stack gap="lg">
        {/* Description Alert */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">{t('mapSearchModal.description')}</Text>
        </Alert>

        {/* Address Search */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" variant="light" color="violet">
                  <IconSearch size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">{t('mapSearchModal.searchByAddress')}</Text>
              </Group>
              <Tooltip label={t('mapSearchModal.getCurrentLocation')}>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  onClick={handleGetCurrentLocation}
                >
                  <IconCurrentLocation size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Group gap="xs">
              <TextInput
                placeholder={t('mapSearchModal.enterAddress')}
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1 }}
                styles={{ input: { fontSize: '16px' } }}
              />
              <Button
                variant="gradient"
                gradient={{ from: 'violet', to: 'grape' }}
                onClick={handleSearchAddress}
                loading={isSearching}
              >
                {t('mapSearchModal.search')}
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Radius Settings */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" variant="light" color="orange">
                  <IconAdjustments size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">{t('mapSearchModal.searchRadius')}</Text>
              </Group>
              <Badge size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                {radiusKm} {t('mapSearchModal.km')}
              </Badge>
            </Group>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 8 }}>
                <Slider
                  value={radiusKm}
                  onChange={setRadiusKm}
                  min={1}
                  max={50}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' }
                  ]}
                  color="orange"
                  size="md"
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  value={radiusKm}
                  onChange={(value) => setRadiusKm(Number(value) || 1)} // ✅ Исправлено: явное приведение к Number
                  min={1}
                  max={50}
                  step={1}
                  suffix={` ${t('mapSearchModal.km')}`}
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Grid.Col>
            </Grid>

            <Alert icon={<IconInfoCircle size={16} />} color="cyan" variant="light">
              <Stack gap={4}>
                <Text size="xs">
                  {t('mapSearchModal.searchArea')}: <strong>{calculateArea(radiusKm)} {t('mapSearchModal.km2')}</strong>
                </Text>
                <Text size="xs" c="dimmed">
                  {t('mapSearchModal.radiusDescription')}
                </Text>
              </Stack>
            </Alert>
          </Stack>
        </Card>

        {/* Map */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="green">
                <IconMapPin size={16} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('mapSearchModal.clickOnMap')}</Text>
            </Group>

            {isLoaded ? (
              <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: isMobile ? '300px' : '400px'
                  }}
                  center={center}
                  zoom={11}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: !isMobile,
                    zoomControl: true
                  }}
                >
                  {markerPosition && (
                    <>
                      <Marker 
                        position={markerPosition}
                        animation={google.maps.Animation.DROP}
                      />
                      <Circle
                        center={markerPosition}
                        radius={radiusKm * 1000}
                        options={{
                          strokeColor: '#FF6B35',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          fillColor: '#FF6B35',
                          fillOpacity: 0.15
                        }}
                      />
                    </>
                  )}
                </GoogleMap>
              </div>
            ) : (
              <div 
                style={{ 
                  height: isMobile ? 300 : 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'var(--mantine-color-dark-6)',
                  borderRadius: '8px'
                }}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon size={60} radius="md" variant="light" color="blue">
                    <IconMapPin size={30} />
                  </ThemeIcon>
                  <Text c="dimmed">{t('mapSearchModal.loadingMap')}</Text>
                </Stack>
              </div>
            )}
          </Stack>
        </Card>

        {/* Selected Location Info */}
        {markerPosition && (
          <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" variant="light" color="teal">
                  <IconMapPin size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">{t('mapSearchModal.selectedLocation')}</Text>
              </Group>
              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">{t('mapSearchModal.latitude')}:</Text>
                  <Text size="sm" fw={500}>{markerPosition.lat.toFixed(6)}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">{t('mapSearchModal.longitude')}:</Text>
                  <Text size="sm" fw={500}>{markerPosition.lng.toFixed(6)}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        )}

        {/* Action Buttons */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Button
              variant="light"
              color="gray"
              size="lg"
              fullWidth
              leftSection={<IconX size={18} />}
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'green' }}
              size="lg"
              fullWidth
              leftSection={<IconCheck size={18} />}
              onClick={handleApply}
            >
              {t('mapSearchModal.apply')}
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
};

export default MapSearchModal;