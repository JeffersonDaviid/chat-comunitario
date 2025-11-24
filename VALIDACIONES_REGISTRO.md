# Validaciones de Registro Implementadas

## ✅ Validaciones de Cédula Ecuatoriana

- **Formato**: Debe tener exactamente 10 dígitos numéricos
- **Provincia**: Los dos primeros dígitos deben corresponder a un código de provincia válido (01-24)
- **Algoritmo de Verificación**: Implementa el algoritmo oficial de validación de cédulas ecuatorianas
  - Usa coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2]
  - Valida el dígito verificador (último dígito)
  
**Validación aplicada en**: Frontend (TypeScript) y Backend (Zod)

## ✅ Validaciones de Teléfono

- **Formato**: Debe tener exactamente 10 dígitos
- **Prefijo**: Debe comenzar con "09"
- **Solo números**: No se permiten letras ni caracteres especiales

**Ejemplo válido**: 0987654321

## ✅ Geolocalización Obligatoria

- **Obtención automática**: Al cargar el formulario, se solicita automáticamente la ubicación del navegador
- **Permisos**: El usuario debe permitir el acceso a la ubicación
- **Campos guardados**: 
  - `latitude`: Latitud (coordenada)
  - `longitude`: Longitud (coordenada)
- **Precisión**: Se utiliza `enableHighAccuracy: true` para obtener la ubicación más precisa posible
- **Botón de actualización**: Permite volver a obtener la ubicación si es necesario

## 🔐 Seguridad

- Las contraseñas se hashean con **bcrypt** (10 salt rounds) antes de guardarse
- No se devuelven contraseñas en las respuestas del API
- Validación de usuarios duplicados (por cédula o email)

## 📦 Campos del Formulario

1. **Cédula** (validada)
2. **Teléfono** (validado)
3. **Nombre** (requerido)
4. **Apellido** (requerido)
5. **Email** (formato email)
6. **Contraseña** (mínimo 6 caracteres)
7. **Confirmar Contraseña** (debe coincidir)
8. **Dirección** (requerida)
9. **Ubicación** (latitud/longitud - obtenida automáticamente)
10. **Foto de Perfil** (opcional, máx 2MB, formato JPG)

## 💾 Base de Datos

Los usuarios se guardan en el array `dbUsers` ubicado en:
`back/src/model/services/DBSIMULATE.ts`

Cada usuario guardado incluye todos los campos validados y la contraseña hasheada.
