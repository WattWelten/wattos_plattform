export default function AdminUsersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nutzer & Rollen</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">
          Neuer Nutzer
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rolle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Placeholder rows */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">Max Mustermann</td>
              <td className="px-6 py-4 whitespace-nowrap">max@example.com</td>
              <td className="px-6 py-4 whitespace-nowrap">Admin</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-primary-600 hover:text-primary-800">
                  Bearbeiten
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


