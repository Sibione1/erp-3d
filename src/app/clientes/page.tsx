"use client";

import { useState, useEffect } from 'react';
import { Client } from '../../types';
import { getStorageData, addClient, deleteClient, updateClient } from '../../lib/storage';

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    billingAddress: '',
  });

  const loadClients = () => {
    setClients(getStorageData<Client>('clients'));
  };

  useEffect(() => {
    loadClients();
    const handleStorage = () => loadClients();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClient(formData);
    setIsAdding(false);
    setFormData({ fullName: '', companyName: '', phone: '', email: '', billingAddress: '' });
    loadClients();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Gestão de Clientes</h2>
          <p className="text-[var(--solar-base1)] mt-1">Cadastre seus clientes para gerar orçamentos e pedidos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-blue)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Adicionar Novo Cliente</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome Completo</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Empresa (Opcional)</label>
              <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">WhatsApp / Telefone</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Endereço de Faturamento / Entrega</label>
              <textarea value={formData.billingAddress} onChange={e => setFormData({...formData, billingAddress: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)] h-24" />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
              <button type="submit" className="bg-[var(--solar-blue)] text-[var(--solar-base2)] px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity">
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <div key={client.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-1">{client.fullName}</h3>
            {client.companyName && <p className="text-[var(--solar-base1)] text-sm mb-3">🏢 {client.companyName}</p>}
            
            <div className="space-y-2 flex-1 mt-4">
              {client.phone && <p className="text-[var(--solar-base0)] text-sm">📱 {client.phone}</p>}
              {client.email && <p className="text-[var(--solar-base0)] text-sm">✉️ {client.email}</p>}
              {client.billingAddress && <p className="text-[var(--solar-base0)] text-sm mt-2">📍 {client.billingAddress}</p>}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex gap-2">
               <button 
                onClick={() => {
                  if(confirm('Excluir este cliente?')) {
                    deleteClient(client.id);
                    loadClients();
                  }
                }}
                className="flex-1 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs py-2 rounded hover:bg-opacity-40 transition-colors"
               >
                 Excluir
               </button>
            </div>
          </div>
        ))}

        {clients.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum cliente cadastrado.</p>
            <button onClick={() => setIsAdding(true)} className="text-[var(--solar-blue)] mt-2 hover:underline">Adicione seu primeiro cliente</button>
          </div>
        )}
      </div>
    </div>
  );
}
