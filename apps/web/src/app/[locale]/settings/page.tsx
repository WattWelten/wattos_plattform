'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@wattweiser/ui';
import { Save, User, Key, Bell, Shield, Globe, Database } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'de',
    timezone: 'Europe/Berlin',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Einstellungen</h1>
          <p className="mt-2 text-lg text-gray-600">
            Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sicherheit</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="preferences">Präferenzen</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <CardTitle>Profilinformationen</CardTitle>
                    <CardDescription>Verwalten Sie Ihre persönlichen Daten</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ihr Name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">E-Mail</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ihre@email.de"
                  />
                </div>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Änderungen speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-100">
                    <Shield className="h-5 w-5 text-error-600" />
                  </div>
                  <div>
                    <CardTitle>Sicherheit</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Sicherheitseinstellungen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Aktuelles Passwort</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Neues Passwort</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Passwort bestätigen</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="gap-2">
                  <Key className="h-4 w-4" />
                  Passwort ändern
                </Button>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
                <CardDescription>Erhöhen Sie die Sicherheit Ihres Kontos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">2FA aktivieren</p>
                    <p className="text-sm text-gray-600">Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitsfaktor</p>
                  </div>
                  <Button variant="outline">Aktivieren</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100">
                    <Bell className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <CardTitle>Benachrichtigungen</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Benachrichtigungseinstellungen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">E-Mail-Benachrichtigungen</p>
                    <p className="text-sm text-gray-600">Erhalten Sie E-Mails bei wichtigen Ereignissen</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push-Benachrichtigungen</p>
                    <p className="text-sm text-gray-600">Erhalten Sie Push-Benachrichtigungen im Browser</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Wöchentlicher Report</p>
                    <p className="text-sm text-gray-600">Erhalten Sie einen wöchentlichen Zusammenfassungsbericht</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </div>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Einstellungen speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                    <Globe className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <CardTitle>Präferenzen</CardTitle>
                    <CardDescription>Sprache, Zeitzone und andere Einstellungen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Zeitzone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                  </select>
                </div>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Präferenzen speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Database className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle>API-Schlüssel</CardTitle>
                    <CardDescription>Verwalten Sie Ihre API-Schlüssel für die Programmierung</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Produktions-API-Schlüssel</p>
                      <p className="text-sm text-gray-600">sk_live_••••••••••••••••</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Kopieren</Button>
                      <Button variant="outline" size="sm">Regenerieren</Button>
                    </div>
                  </div>
                </div>
                <Button className="gap-2">
                  <Key className="h-4 w-4" />
                  Neuer API-Schlüssel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
