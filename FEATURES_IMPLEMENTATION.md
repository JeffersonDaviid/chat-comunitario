# Implementación de Carga de Archivos en Chat Comunitario

## ✅ Cambios Realizados

### 1. **Frontend - Componente Chat (`chat.component.ts`)**

#### Nuevas Propiedades:
- `filePreview: FilePreview | null` - Almacena la vista previa del archivo
- `maxFileSize` - Límite de 50MB por archivo
- `allowedImageTypes` - Tipos MIME permitidos: JPG, PNG, GIF, WebP
- `allowedDocTypes` - Tipos permitidos: PDF, Word (.doc, .docx), TXT

#### Nuevos Métodos:

**`onFileSelected(event: any)`**
- Valida el archivo seleccionado
- Verifica tipo MIME y tamaño
- Crea vista previa (imagen o documento)

**`clearFilePreview()`**
- Limpia la vista previa del archivo

**`send()`**
- Modificado para enviar archivos en base64
- Codifica el archivo como DataURL
- Envía metadatos (nombre, tipo, tamaño)

**`downloadFile(m: WSMessage)`**
- Descarga archivos desde el navegador
- Usa elemento `<a>` con `download`

**`getFileExtension(fileName: string): string`**
- Extrae extensión del archivo para mostrar

**`hasFile(m: WSMessage): boolean`**
- Verifica si el mensaje contiene archivo

**`isImage(m: WSMessage): boolean`**
- Determina si el archivo es imagen

### 2. **Frontend - Template HTML (`chat.component.html`)**

#### Nuevos Elementos:

**Vista Previa de Archivo:**
- Antes de enviar, se muestra un preview en la zona de composición
- Para imágenes: muestra miniatura
- Para documentos: muestra extensión + nombre + tamaño
- Botón para limpiar la selección

**Botón de Carga:**
- Agregado input file con ícono de "más"
- Acepta: imágenes y documentos (pdf, doc, docx, txt)

**Renderización de Mensajes con Archivos:**
- Imágenes: se muestran inline con clase `file-preview-container`
- Documentos: tarjeta con ícono, nombre y botón de descarga
- Ambos con hover effects

### 3. **Frontend - Estilos (`chat.component.css`)**

Agregadas animaciones para:
- `fadeIn` - Transición suave para imágenes
- `slideUp` - Deslizamiento para documentos

### 4. **Servicio WebSocket (`websocket.service.ts`)**

El servicio ya está preparado para:
- Enviar mensajes con propiedades adicionales (archivos, metadata)
- Recibir y normalizar mensajes con contenido de archivo
- Mantener retrocompatibilidad con mensajes de texto puro

## 📁 Estructura del Mensaje Enviado

```typescript
{
  type: 'chat',
  payload: {
    text: "Opcional: mensaje de texto",
    channelId: "id-del-canal",
    sender: {
      username: "Nombre Usuario",
      cedula: "1234567",
      avatar: "url-avatar"
    },
    cedula: "1234567",
    file: {              // Nuevo
      name: "documento.pdf",
      type: "application/pdf",
      size: 102400,
      data: "data:application/pdf;base64,JVBERi0xLjQK..."
    },
    ts: 1700000000000
  }
}
```

## 🎯 Características Implementadas

✅ **Carga de Archivos**
- Imágenes (JPG, PNG, GIF, WebP)
- Documentos (PDF, Word, TXT)
- Validación de tipo y tamaño

✅ **Vista Previa**
- Antes de enviar el usuario puede ver el archivo
- Opción de cancelar la carga

✅ **Descarga de Archivos**
- Click en documento descarga el archivo
- Las imágenes se muestran inline

✅ **Compatibilidad**
- Mensajes de texto puro aún funcionan
- No hay cambios en backend requeridos para lo básico

## 🚀 Cómo Usar

### Usuario Enviando:
1. Click en botón "+" para seleccionar archivo
2. Se muestra vista previa en la composición
3. Escribir mensaje opcional
4. Click en "Enviar" para transmitir

### Usuario Recibiendo:
- **Imágenes**: Se muestran automáticamente
- **Documentos**: Ver nombre y descargar con click

## ⚠️ Notas Importantes

- **Base64**: Los archivos se codifican en base64 para transmisión WebSocket
- **Límite 50MB**: Puede ajustarse en `maxFileSize`
- **Backend**: Adaptarse para almacenar base64 si se desea persistencia
- **Historial**: El endpoint `loadHistory()` necesitará adaptar base64 para archivos históricos

## 🔄 Proximas Mejoras (Opcionales)

- Comprimir imágenes antes de enviar
- Mostrar barra de progreso durante carga
- Cancelar uploads en curso
- Compartir archivos de forma persistente en el servidor
- Soporte para más tipos de archivo
