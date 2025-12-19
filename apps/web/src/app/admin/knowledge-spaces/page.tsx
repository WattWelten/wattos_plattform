export default function AdminKnowledgeSpacesPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Wissensräume</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">
          Neuer Wissensraum
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">IT-Dokumentation</h3>
          <p className="text-gray-600 mb-4">12 Dokumente</p>
          <button className="text-primary-600 hover:text-primary-800">
            Öffnen
          </button>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Produktkatalog</h3>
          <p className="text-gray-600 mb-4">45 Dokumente</p>
          <button className="text-primary-600 hover:text-primary-800">
            Öffnen
          </button>
        </div>
      </div>
    </div>
  );
}


