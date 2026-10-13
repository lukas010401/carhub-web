import { ChangeEvent, useRef, useState } from 'react';
import { MAX_LISTING_PHOTOS, MAX_SOURCE_IMAGE_MB } from '@/lib/image-upload';

interface Props {
  onSelect: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  inputId?: string;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUploader({
  onSelect,
  maxFiles = MAX_LISTING_PHOTOS,
  maxFileSizeMb = MAX_SOURCE_IMAGE_MB,
  inputId = 'images',
  disabled = false
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const maxSize = maxFileSizeMb * 1024 * 1024;

  const applyFiles = (nextFiles: File[]) => {
    setFiles(nextFiles);
    onSelect(nextFiles);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setError('');
    applyFiles(next);
  };

  const clearAll = () => {
    setError('');
    applyFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    const rejected: string[] = [];

    for (const file of selected) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isAccepted = ACCEPTED_EXTENSIONS.includes(ext);
      if (!isAccepted) {
        rejected.push(`${file.name}: format non pris en charge`);
        continue;
      }
      if (file.size > maxSize) {
        rejected.push(`${file.name}: dépasse ${maxFileSizeMb} MB`);
        continue;
      }
      valid.push(file);
      if (valid.length >= maxFiles) break;
    }

    if (selected.length > maxFiles) {
      rejected.push(`Maximum ${maxFiles} photos`);
    }

    setError(rejected.join(' | '));
    applyFiles(valid.slice(0, maxFiles));
  };

  return (
    <div className="uploader">
      <label htmlFor={inputId}>Photos</label>
      <p className="uploaderHint">Formats: jpg, jpeg, png, webp. Max {maxFiles} photos, {maxFileSizeMb} MB par photo avant optimisation. Les photos sont réduites automatiquement avant envoi.</p>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        disabled={disabled || maxFiles === 0}
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handle}
      />
      {error && <p className="uploaderError">{error}</p>}
      {files.length > 0 && (
        <div className="uploaderList">
          <div className="uploaderListHeader">
            <p>{files.length} photo(s) sélectionnée(s)</p>
            <button type="button" className="ghostBtn" onClick={clearAll} disabled={disabled}>Vider</button>
          </div>
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="uploaderItem">
              <span>{file.name} ({formatSize(file.size)})</span>
              <button type="button" className="ghostBtn" onClick={() => removeAt(idx)} disabled={disabled}>Retirer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
