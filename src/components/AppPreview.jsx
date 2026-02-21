const AppPreview = ({ type = 'phone', src, alt = 'App screenshot' }) => {
  const aspectClass = type === 'wide'
    ? 'aspect-[16/10]'
    : 'aspect-[9/19.5]';

  const maxWidthClass = type === 'wide'
    ? 'max-w-md'
    : 'max-w-[240px]';

  if (src) {
    return (
      <div className={`app-preview ${maxWidthClass} ${aspectClass}`}>
        {src.endsWith('.mp4') || src.endsWith('.webm') ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          </video>
        ) : (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <div className={`app-preview app-preview-placeholder ${maxWidthClass} ${aspectClass}`}>
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <line x1="5" y1="18" x2="19" y2="18" />
        </svg>
        <span className="text-[10px] font-courier text-white/15 tracking-wider uppercase">{alt}</span>
      </div>
    </div>
  );
};

export default AppPreview;
