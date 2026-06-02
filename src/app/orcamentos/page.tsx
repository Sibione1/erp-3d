"use client";

import { useState, useEffect } from 'react';
import { Order, OrderItem, Client, Project, Filament } from '../../types';
import { getStorageData, addOrder, deleteOrder, updateOrder } from '../../lib/storage';
import ClientModal from '../../components/ClientModal';
import ProjectModal from '../../components/ProjectModal';

const MACHINE_COST_PER_HOUR = 0.50; // Custo fixo estimado por hora (Energia + Depreciação)

export default function OrcamentosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [margin, setMargin] = useState(50);
  const [shippingCost, setShippingCost] = useState(0);

  const [formData, setFormData] = useState<{
    clientId: string;
    projectId: string;
    filamentIds: string[];
  }>({
    clientId: '',
    projectId: '',
    filamentIds: [],
  });

  // Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

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

  // Filter ONLY Quotes
  const quotes = orders.filter(o => o.isQuote);

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedClient = clients.find(c => c.id === formData.clientId);
  
  let averageCostPerGram = 0;
  if (formData.filamentIds.length > 0) {
    let totalCostPerGram = 0;
    formData.filamentIds.forEach(id => {
      const fil = filaments.find(f => f.id === id);
      if (fil) {
        totalCostPerGram += fil.purchaseCost / fil.initialWeightG;
      }
    });
    averageCostPerGram = totalCostPerGram / formData.filamentIds.length;
  }

  let filamentCost = 0;
  let machineCost = 0;
  let totalCost = 0;
  let suggestedPrice = 0;

  if (selectedProject && formData.filamentIds.length > 0) {
    filamentCost = selectedProject.estimatedConsumptionG * averageCostPerGram;
    const hours = selectedProject.estimatedPrintTimeMinutes / 60;
    machineCost = hours * MACHINE_COST_PER_HOUR;
    totalCost = filamentCost + machineCost + shippingCost;
    suggestedPrice = totalCost / (1 - (margin / 100));
  }

  const toggleFilament = (id: string) => {
    setFormData(prev => {
      if (prev.filamentIds.includes(id)) {
        return { ...prev, filamentIds: prev.filamentIds.filter(fId => fId !== id) };
      } else {
        if (prev.filamentIds.length >= 4) {
          alert('Você só pode selecionar até 4 filamentos (Cores) por projeto!');
          return prev;
        }
        return { ...prev, filamentIds: [...prev.filamentIds, id] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.filamentIds.length === 0 || !selectedProject) {
      alert('Selecione o Projeto e ao menos 1 filamento!');
      return;
    }

    const orderNumber = `ORC-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(orders.length + 1).padStart(3,'0')}`;
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      type: '3D_PROJECT',
      name: selectedProject.name,
      projectId: selectedProject.id,
      filamentIds: formData.filamentIds,
      status: 'Pendente',
      wastedGrams: 0,
      wastedCost: 0,
      price: suggestedPrice - shippingCost, // Item price without shipping
      cost: filamentCost + machineCost
    };

    addOrder({
      orderNumber,
      clientId: formData.clientId,
      isQuote: true,
      items: [newItem],
      status: 'Pendente',
      paymentStatus: 'Pendente',
      calculatedCost: totalCost,
      machineCost,
      filamentCost,
      shippingCost,
      finalPrice: suggestedPrice,
      marginPercentage: margin,
      estimatedDeliveryDate: estimatedDelivery.toISOString()
    });
    
    setIsAdding(false);
    setFormData({ clientId: '', projectId: '', filamentIds: [] });
    setShippingCost(0);
    loadData();
  };

  const approveQuote = (order: Order) => {
    if(confirm('Aprovar este Orçamento? Ele será convertido em Pedido e movido para a tela de Pedidos.')) {
      // Create a new orderNumber starting with PED-
      const newOrderNumber = order.orderNumber.replace('ORC-', 'PED-');
      updateOrder(order.id, { isQuote: false, orderNumber: newOrderNumber, status: 'Em Andamento' });
      loadData();
    }
  };

  const generateWhatsAppLink = (order: Order, client: Client) => {
    const text = `Olá ${client.fullName}! Tudo bem?\n\nO orçamento *${order.orderNumber}* ficou pronto!\n\n*Itens:* ${order.items.map(i => i.name).join(', ')}\n*Valor Total:* R$ ${order.finalPrice.toFixed(2)}\n*Prazo Estimado:* ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'A combinar'}\n\nO que acha? Podemos dar andamento na produção?`;
    return `https://wa.me/${client.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 pb-20">
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} onSuccess={(id) => { setShowClientModal(false); setFormData(prev => ({ ...prev, clientId: id })); loadData(); }} />
      <ProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} onSuccess={(id) => { setShowProjectModal(false); setFormData(prev => ({ ...prev, projectId: id })); loadData(); }} />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Orçamentos</h2>
          <p className="text-[var(--solar-base1)] mt-1">Simulações e propostas enviadas aos clientes.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-[var(--solar-orange)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
          {isAdding ? 'Cancelar' : '+ Novo Orçamento'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Calculadora de Precificação</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Cliente *</label>
                  <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                    <option value="">Selecione um Cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setShowClientModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)]">+ Novo</button>
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Projeto / Modelo 3D *</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                    <option value="">Selecione um Projeto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.estimatedConsumptionG}g)</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setShowProjectModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)]">+ Novo</button>
              </div>

              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-2">Filamentos / Cores (Até 4 opções AMS) *</label>
                <div className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] p-3 rounded flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {filaments.map(f => {
                    const isSelected = formData.filamentIds.includes(f.id);
                    return (
                      <button key={f.id} type="button" onClick={() => toggleFilament(f.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isSelected ? 'border-[var(--solar-blue)] bg-[var(--solar-blue)] bg-opacity-10 text-[var(--solar-base2)]' : 'border-[var(--solar-base02)] bg-[var(--solar-base02)] text-[var(--solar-base0)]'}`}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.colorHex || '#ccc' }}></div>
                        {f.brand} - {f.colorName}
                        {isSelected && <span className="text-[var(--solar-blue)] ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Margem de Lucro (%)</label>
                  <input required type="number" min="0" max="99" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Custo de Envio (R$)</label>
                  <input type="number" min="0" step="0.01" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
              </div>

            </div>

            <div className="bg-[var(--solar-base03)] p-6 rounded-xl border border-[var(--solar-base01)] flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-[var(--solar-base2)] mb-4">Resumo Financeiro</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Gasto Máquina ({selectedProject ? Math.round(selectedProject.estimatedPrintTimeMinutes/60) : 0}h):</span>
                    <span className="font-mono">R$ {machineCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Material (Média {selectedProject?.estimatedConsumptionG || 0}g):</span>
                    <span className="font-mono">R$ {filamentCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Envio:</span>
                    <span className="font-mono">R$ {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--solar-base0)] border-t border-[var(--solar-base02)] pt-3 mt-3">
                    <span>Custo Total:</span>
                    <span className="font-mono">R$ {totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[var(--solar-base1)] text-sm mb-1">Preço Sugerido</p>
                <p className="text-4xl font-bold text-[var(--solar-yellow)]">R$ {suggestedPrice.toFixed(2)}</p>
              </div>

              <button type="submit" disabled={formData.filamentIds.length === 0 || !formData.clientId || !formData.projectId} className="w-full mt-6 bg-[var(--solar-orange)] text-[var(--solar-base03)] px-6 py-3 rounded font-bold hover:opacity-90 disabled:opacity-50">
                Salvar Orçamento
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {quotes.map(order => {
          const client = clients.find(c => c.id === order.clientId);
          
          return (
            <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col relative">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[var(--solar-base1)] text-xs font-mono">{order.orderNumber}</span>
                <span className="text-[var(--solar-base1)] text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-2">{client?.fullName || 'Cliente Removido'}</h3>
              
              <div className="bg-[var(--solar-base03)] p-3 rounded-xl border border-[var(--solar-base01)] mb-4 space-y-2">
                {(order.items || []).map(item => (
                   <div key={item.id} className="text-sm">
                     <p className="text-[var(--solar-base0)] font-bold">📦 {item.name}</p>
                     <div className="flex flex-wrap gap-1 mt-1">
                        {item.filamentIds?.map(fid => {
                           const f = filaments.find(fi => fi.id === fid);
                           if(!f) return null;
                           return <div key={f.id} title={f.colorName} className="w-3 h-3 rounded-full" style={{backgroundColor: f.colorHex||'#ccc'}} />
                        })}
                     </div>
                   </div>
                ))}
              </div>

              <div className="text-sm flex justify-between font-bold mb-4">
                <span className="text-[var(--solar-base0)]">Valor Proposto:</span>
                <span className="text-[var(--solar-yellow)]">R$ {order.finalPrice.toFixed(2)}</span>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <a href={generateWhatsAppLink(order, client as Client)} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white text-xs py-2 rounded text-center hover:opacity-90 font-bold">
                  WhatsApp
                </a>
                
                <button onClick={() => approveQuote(order)} className="flex-1 bg-[var(--solar-green)] text-[var(--solar-base03)] text-xs py-2 rounded font-bold hover:opacity-90">
                  Aprovar (Virar Pedido)
                </button>
                 <button onClick={() => { if(confirm('Excluir orçamento?')) deleteOrder(order.id); loadData(); }} className="w-10 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] rounded flex items-center justify-center hover:bg-opacity-40">
                   🗑️
                 </button>
              </div>
            </div>
          );
        })}

        {quotes.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum orçamento pendente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
