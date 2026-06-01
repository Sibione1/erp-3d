"use client";

import { useState, useEffect } from 'react';
import { Order, Client, Project, Filament } from '../../types';
import { getStorageData, addOrder, deleteOrder, updateOrder } from '../../lib/storage';

const MACHINE_COST_PER_HOUR = 0.50; // Custo fixo estimado por hora (Energia + Depreciação)

export default function OrcamentosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [margin, setMargin] = useState(50); // Margem de lucro padrão 50%
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    filamentId: '',
  });

  const loadData = () => {
    setOrders(getStorageData<Order>('orders'));
    setClients(getStorageData<Client>('clients'));
    setProjects(getStorageData<Project>('projects'));
    setFilaments(getStorageData<Filament>('filaments'));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedFilament = filaments.find(f => f.id === formData.filamentId);
  const selectedClient = clients.find(c => c.id === formData.clientId);

  // Cálculos de precificação
  let filamentCost = 0;
  let machineCost = 0;
  let totalCost = 0;
  let suggestedPrice = 0;

  if (selectedProject && selectedFilament) {
    const costPerGram = selectedFilament.purchaseCost / selectedFilament.initialWeightG;
    filamentCost = selectedProject.estimatedConsumptionG * costPerGram;
    
    const hours = selectedProject.estimatedPrintTimeMinutes / 60;
    machineCost = hours * MACHINE_COST_PER_HOUR;
    
    totalCost = filamentCost + machineCost;
    // Preço = Custo / (1 - Margem%)
    suggestedPrice = totalCost / (1 - (margin / 100));
  }

  const isSufficientFilament = selectedFilament && selectedProject 
    ? selectedFilament.currentWeightG >= selectedProject.estimatedConsumptionG 
    : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSufficientFilament) {
      alert('Filamento insuficiente para este projeto!');
      return;
    }

    addOrder({
      clientId: formData.clientId,
      projectId: formData.projectId,
      printerId: 'default-printer', // Mock
      filamentId: formData.filamentId,
      status: 'Pendente',
      calculatedCost: totalCost,
      finalPrice: suggestedPrice,
    });
    
    setIsAdding(false);
    setFormData({ clientId: '', projectId: '', filamentId: '' });
    loadData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Orçamentos e Ordens de Serviço</h2>
          <p className="text-[var(--solar-base1)] mt-1">Calcule o custo exato e gere orçamentos para seus clientes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-orange)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Orçamento'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Calculadora de Precificação</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Cliente</label>
                <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                  <option value="">Selecione um Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Projeto / Modelo 3D</label>
                <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                  <option value="">Selecione um Projeto...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.estimatedConsumptionG}g)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Filamento (Estoque)</label>
                <select required value={formData.filamentId} onChange={e => setFormData({...formData, filamentId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                  <option value="">Selecione o Material...</option>
                  {filaments.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.brand} - {f.colorName} (Resta: {f.currentWeightG}g)
                    </option>
                  ))}
                </select>
                {selectedFilament && !isSufficientFilament && (
                  <p className="text-[var(--solar-red)] text-sm mt-1 font-bold">⚠️ Estoque Insuficiente para este projeto!</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Margem de Lucro Desejada (%)</label>
                <input required type="number" min="0" max="99" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>

            <div className="bg-[var(--solar-base03)] p-6 rounded-xl border border-[var(--solar-base01)] flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-[var(--solar-base2)] mb-4">Resumo Financeiro</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo do Material ({selectedProject?.estimatedConsumptionG || 0}g):</span>
                    <span className="font-mono">R$ {filamentCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo de Máquina (Tempo x Depreciação):</span>
                    <span className="font-mono">R$ {machineCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--solar-base0)] border-t border-[var(--solar-base02)] pt-2 mt-2">
                    <span>Custo Total de Produção:</span>
                    <span className="font-mono">R$ {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)] mt-2">
                    <span>Lucro Líquido Projetado:</span>
                    <span className="font-mono text-[var(--solar-green)]">R$ {(suggestedPrice - totalCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[var(--solar-base1)] text-sm mb-1">Preço Sugerido (com {margin}% de margem)</p>
                <p className="text-4xl font-bold text-[var(--solar-yellow)]">R$ {suggestedPrice.toFixed(2)}</p>
              </div>

              <button 
                type="submit" 
                disabled={!isSufficientFilament || !formData.clientId} 
                className="w-full mt-6 bg-[var(--solar-orange)] text-[var(--solar-base03)] px-6 py-3 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gerar Orçamento / Criar OS
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => {
          const client = clients.find(c => c.id === order.clientId);
          const project = projects.find(p => p.id === order.projectId);
          const filament = filaments.find(f => f.id === order.filamentId);

          return (
            <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  order.status === 'Pendente' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 
                  order.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 
                  'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                }`}>
                  {order.status}
                </span>
                <span className="text-[var(--solar-base1)] text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">{client?.fullName || 'Cliente Removido'}</h3>
              <p className="text-[var(--solar-base0)] text-sm mb-4">📦 {project?.name || 'Projeto Removido'}</p>
              
              <div className="space-y-1 text-sm bg-[var(--solar-base03)] p-3 rounded mb-4">
                <p className="text-[var(--solar-base1)]">Filamento: <span className="text-[var(--solar-base0)]">{filament?.brand} {filament?.colorName}</span></p>
                <p className="text-[var(--solar-base1)]">Custo Produção: <span className="text-[var(--solar-base0)]">R$ {order.calculatedCost.toFixed(2)}</span></p>
                <p className="text-[var(--solar-base1)]">Valor Final: <span className="text-[var(--solar-green)] font-bold">R$ {order.finalPrice.toFixed(2)}</span></p>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--solar-base01)] flex gap-2">
                {order.status === 'Pendente' && (
                  <button 
                    onClick={() => {
                      updateOrder(order.id, { status: 'Concluído' });
                      loadData();
                    }}
                    className="flex-1 bg-[var(--solar-green)] text-[var(--solar-base03)] text-xs py-2 rounded hover:opacity-90 font-bold"
                  >
                    Marcar Concluído
                  </button>
                )}
                 <button 
                  onClick={() => {
                    if(confirm('Excluir esta Ordem de Serviço?')) {
                      deleteOrder(order.id);
                      loadData();
                    }
                  }}
                  className="bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs px-3 py-2 rounded hover:bg-opacity-40 transition-colors"
                 >
                   🗑️
                 </button>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum orçamento gerado.</p>
            <button onClick={() => setIsAdding(true)} className="text-[var(--solar-orange)] mt-2 hover:underline">Crie seu primeiro orçamento</button>
          </div>
        )}
      </div>
    </div>
  );
}
