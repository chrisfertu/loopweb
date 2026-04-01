const PhoneFrame = ({ children, className = '' }) => (
  <div className={`phone-frame ${className}`}>
    {/* Dynamic Island */}
    <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-10 w-[90px] h-[26px] bg-black rounded-full" />
    {/* Screen content */}
    <div className="absolute inset-[2px] rounded-[38px] overflow-hidden bg-black">
      {children}
    </div>
  </div>
);

export default PhoneFrame;
