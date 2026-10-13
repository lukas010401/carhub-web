import { UploadProgress } from '@/lib/api';

export default function UploadStatus({ progress }: { progress: UploadProgress | null }) {
  if (!progress) return null;
  const label = progress.stage === 'preparing' ? 'Préparation' : progress.stage === 'saving' ? 'Enregistrement' : 'Envoi';
  return (
    <div role="status" aria-live="polite" className="sellerNotice sellerNoticeInfo">
      <p style={{ margin: 0 }}>{label} de la photo {progress.photo}/{progress.total}
        {progress.stage === 'sending' ? ` : ${progress.percent} %` : '…'}</p>
      {progress.stage !== 'preparing' && (
        <progress max={100} value={progress.percent} aria-label="Progression de la photo" style={{ width: '100%' }} />
      )}
    </div>
  );
}