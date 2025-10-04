import * as Cesium from 'cesium';
/**
 * Get latitude and longitude in degrees for a Cesium entity
 * @param entity
 */
export function getEntityLatLon(
  entity: Cesium.Entity | undefined
): { latitude: number; longitude: number } | undefined {
  const entityPosition = entity?.position;
  if (!entity || !entityPosition) return;

  const position = entityPosition.getValue(Cesium.JulianDate.now());
  if (!Cesium.defined(position)) return;

  const cartographic = Cesium.Cartographic.fromCartesian(
    position as Cesium.Cartesian3
  );
  if (!cartographic) return;

  const { latitude, longitude } = cartographic;
  return {
    latitude: Cesium.Math.toDegrees(latitude),
    longitude: Cesium.Math.toDegrees(longitude),
  };
}
