
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">OnTime Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to OnTime</h2>
          <p className="text-gray-600">Application is working correctly!</p>
          <div className="mt-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Test Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
