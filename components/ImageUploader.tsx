import { ChangeEvent, useRef, useState } from 'react';

interface Props {
  onSelect: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  inputId?: string;
}

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUploader({
  onSelect,
  maxFiles = 20,
  maxFileSizeMb = 8,
  inputId = 'images'
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
      const isAccepted = ACCEPTED_EXTENSIONS.includes(ext) || file.type.startsWith('image/');
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
      <p className="uploaderHint">Formats: jpg, jpeg, png, webp. Max {maxFiles} photos, {maxFileSizeMb} MB par photo.</p>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handle}
      />
      {error && <p className="uploaderError">{error}</p>}
      {files.length > 0 && (
        <div className="uploaderList">
          <div className="uploaderListHeader">
            <p>{files.length} photo(s) sélectionnée(s)</p>
            <button type="button" className="ghostBtn" onClick={clearAll}>Vider</button>
          </div>
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="uploaderItem">
              <span>{file.name} ({formatSize(file.size)})</span>
              <button type="button" className="ghostBtn" onClick={() => removeAt(idx)}>Retirer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
