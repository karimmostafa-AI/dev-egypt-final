export default function ImageTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Test Page</h1>
      
      {/* Direct image test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Direct Image Tag:</h2>
        <img 
          src="/images/brands/hero-omaima.jpg" 
          alt="Omaima Hero Test" 
          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          onError={(e) => {
            console.error('Image failed to load:', e);
            e.currentTarget.style.border = '2px solid red';
            e.currentTarget.alt = 'Image failed to load';
          }}
          onLoad={() => {
            console.log('Image loaded successfully!');
          }}
        />
      </div>
      
      {/* Background image test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Background Image Test:</h2>
        <div 
          className="w-full h-64 max-w-md mx-auto rounded-lg shadow-lg bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/brands/hero-omaima.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
            <p className="text-white font-bold">Background Image Test</p>
          </div>
        </div>
      </div>
      
      {/* Image info */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Image path: /images/brands/hero-omaima.jpg<br/>
          Check browser console for load status
        </p>
      </div>
    </div>
  );
}