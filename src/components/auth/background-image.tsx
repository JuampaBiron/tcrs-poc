export default function BackgroundImage() {
  return (
    <div className="absolute inset-0">
      {/* Imagen de fondo */}
      <img 
        src="/landscape.jpg" 
        alt="background"
        className="w-full h-full object-cover"
      />
      {/* Velo negro */}
      <div className="absolute inset-0 bg-black/80"></div>
    </div>
  );
}