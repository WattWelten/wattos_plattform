export default function AdminProvidersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LLM-Provider</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">
          Neuer Provider
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">OpenAI</h3>
          <p className="text-gray-600 mb-4">Status: Aktiv</p>
          <button className="text-primary-600 hover:text-primary-800">
            Konfigurieren
          </button>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Anthropic</h3>
          <p className="text-gray-600 mb-4">Status: Inaktiv</p>
          <button className="text-primary-600 hover:text-primary-800">
            Konfigurieren
          </button>
        </div>
      </div>
    </div>
  );
}


