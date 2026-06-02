"use client";

import { useState, useEffect } from 'react';
import { Order, Client, Project, Filament } from '../../types';
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

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedClient = clients.find(c => c.id === formData.clientId);
  
  // Calculate average cost per gram of selected filaments
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

  // Cálculos de precificação
  let filamentCost = 0;
  let machineCost = 0;
  let totalCost = 0;
  let suggestedPrice = 0;

  if (selectedProject && formData.filamentIds.length > 0) {
    filamentCost = selectedProject.estimatedConsumptionG * averageCostPerGram;
    
    const hours = selectedProject.estimatedPrintTimeMinutes / 60;
    machineCost = hours * MACHINE_COST_PER_HOUR;
    
    totalCost = filamentCost + machineCost + shippingCost;
    // Preço = Custo / (1 - Margem%)
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
    if (formData.filamentIds.length === 0) {
      alert('Selecione ao menos 1 filamento!');
      return;
    }

    const orderNumber = `OS-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(orders.length + 1).padStart(3,'0')}`;
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // Prazo padrão: 3 dias

    addOrder({
      orderNumber,
      clientId: formData.clientId,
      projectId: formData.projectId,
      printerId: 'default-printer',
      filamentIds: formData.filamentIds,
      status: 'Pendente',
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

  const generateWhatsAppLink = (order: Order, client: Client, project: Project) => {
    const text = `Olá ${client.fullName}! Tudo bem?\n\nO orçamento para o seu projeto *${project.name}* (${order.orderNumber}) ficou pronto!\n\n*Valor Total:* R$ ${order.finalPrice.toFixed(2)}\n*Prazo Estimado:* ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'A combinar'}\n\nO que acha? Podemos dar andamento na produção?`;
    return `https://wa.me/${client.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 pb-20">
      
      <ClientModal 
        isOpen={showClientModal} 
        onClose={() => setShowClientModal(false)} 
        onSuccess={(id) => {
          setShowClientModal(false);
          setFormData(prev => ({ ...prev, clientId: id }));
          loadData();
        }} 
      />

      <ProjectModal 
        isOpen={showProjectModal} 
        onClose={() => setShowProjectModal(false)} 
        onSuccess={(id) => {
          setShowProjectModal(false);
          setFormData(prev => ({ ...prev, projectId: id }));
          loadData();
        }} 
      />

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
                <button type="button" onClick={() => setShowClientModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)] whitespace-nowrap">
                  + Novo
                </button>
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Projeto / Modelo 3D *</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                    <option value="">Selecione um Projeto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.estimatedConsumptionG}g)</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setShowProjectModal(true)} className="bg-[var(--solar-base01)] text-[var(--solar-base03)] px-3 py-2 rounded font-bold hover:bg-[var(--solar-base00)] whitespace-nowrap">
                  + Novo
                </button>
              </div>

              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-2">Filamentos / Cores (Até 4 opções AMS) *</label>
                <div className="bg-[var(--solar-base03)] border border-[var(--solar-base01)] p-3 rounded flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {filaments.length === 0 && <span className="text-sm text-[var(--solar-base01)]">Nenhum filamento no estoque.</span>}
                  {filaments.map(f => {
                    const isSelected = formData.filamentIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFilament(f.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected ? 'border-[var(--solar-blue)] bg-[var(--solar-blue)] bg-opacity-10 text-[var(--solar-base2)]' : 'border-[var(--solar-base02)] bg-[var(--solar-base02)] text-[var(--solar-base0)] hover:border-[var(--solar-base01)]'}`}
                      >
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: f.colorHex || '#ccc' }}></div>
                        {f.brand} - {f.colorName}
                        {isSelected && <span className="text-[var(--solar-blue)] ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Margem de Lucro Desejada (%)</label>
                  <input required type="number" min="0" max="99" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--solar-base1)] mb-1">Custo de Envio / Frete (R$)</label>
                  <input type="number" min="0" step="0.01" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
                </div>
              </div>

            </div>

            <div className="bg-[var(--solar-base03)] p-6 rounded-xl border border-[var(--solar-base01)] flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-[var(--solar-base2)] mb-4">Resumo Financeiro</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Gasto de Energia + Máquina ({selectedProject ? Math.round(selectedProject.estimatedPrintTimeMinutes/60) : 0}h):</span>
                    <span className="font-mono">R$ {machineCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo de Filamento (Média {selectedProject?.estimatedConsumptionG || 0}g):</span>
                    <span className="font-mono">R$ {filamentCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)]">
                    <span>Custo de Envio (Embalagem/Frete):</span>
                    <span className="font-mono">R$ {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[var(--solar-base0)] border-t border-[var(--solar-base02)] pt-3 mt-3">
                    <span>Custo Total:</span>
                    <span className="font-mono">R$ {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--solar-base1)] mt-2">
                    <span>Margem de Lucro Projetada ({margin}%):</span>
                    <span className="font-mono text-[var(--solar-green)]">R$ {(suggestedPrice - totalCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[var(--solar-base1)] text-sm mb-1">Preço de Venda Sugerido</p>
                <p className="text-4xl font-bold text-[var(--solar-yellow)]">R$ {suggestedPrice.toFixed(2)}</p>
              </div>

              <button 
                type="submit" 
                disabled={formData.filamentIds.length === 0 || !formData.clientId || !formData.projectId} 
                className="w-full mt-6 bg-[var(--solar-orange)] text-[var(--solar-base03)] px-6 py-3 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Gerar Orçamento / Criar OS
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map(order => {
          const client = clients.find(c => c.id === order.clientId);
          const project = projects.find(p => p.id === order.projectId);
          const activeFilaments = filaments.filter(f => order.filamentIds?.includes(f.id));

          return (
            <div key={order.id} className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm flex flex-col relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[var(--solar-base1)] text-xs font-mono mb-1">{order.orderNumber || 'OS-000'}</span>
                  <span className={`px-2 py-1 rounded w-max text-xs font-bold ${
                    order.status === 'Pendente' ? 'bg-[var(--solar-yellow)] text-[var(--solar-base03)]' : 
                    order.status === 'Concluído' ? 'bg-[var(--solar-green)] text-[var(--solar-base03)]' : 
                    'bg-[var(--solar-base01)] text-[var(--solar-base03)]'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[var(--solar-base1)] text-xs font-bold">Criado em</span>
                  <span className="text-[var(--solar-base0)] text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-[var(--solar-base2)] mb-1">{client?.fullName || 'Cliente Removido'}</h3>
              <p className="text-[var(--solar-base0)] text-sm mb-4">📦 {project?.name || 'Projeto Removido'}</p>
              
              {/* Filament Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {activeFilaments.map(f => (
                  <div key={f.id} title={`${f.brand} - ${f.colorName}`} className="w-4 h-4 rounded-full border border-[var(--solar-base01)] shadow-sm" style={{ backgroundColor: f.colorHex || '#ccc' }}></div>
                ))}
              </div>

              {/* Finance Box */}
              <div className="space-y-1 text-sm bg-[var(--solar-base03)] p-4 rounded-xl border border-[var(--solar-base01)] mb-4">
                <div className="flex justify-between text-[var(--solar-base1)]">
                  <span>Custo Total:</span>
                  <span>R$ {order.calculatedCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-[var(--solar-base02)] mt-1">
                  <span className="text-[var(--solar-base0)]">Valor Final:</span>
                  <span className="text-[var(--solar-green)]">R$ {order.finalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-auto pt-4 flex gap-2">
                {order.status === 'Pendente' && (
                  <>
                    <a 
                      href={generateWhatsAppLink(order, client as Client, project as Project)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[var(--solar-green)] text-[var(--solar-base03)] text-xs py-2 rounded text-center hover:opacity-90 font-bold transition-opacity"
                    >
                      WhatsApp
                    </a>
                    <a 
                      href={`mailto:${client?.email || ''}?subject=Orçamento de Impressão 3D (${order.orderNumber})`}
                      className="flex-1 bg-[var(--solar-blue)] text-[var(--solar-base03)] text-xs py-2 rounded text-center hover:opacity-90 font-bold transition-opacity"
                    >
                      E-mail
                    </a>
                  </>
                )}
                
                {order.status === 'Pendente' ? (
                  <button 
                    title="Marcar como Concluído"
                    onClick={() => {
                      updateOrder(order.id, { status: 'Concluído' });
                      loadData();
                    }}
                    className="w-10 bg-[var(--solar-base01)] text-[var(--solar-base03)] rounded flex items-center justify-center hover:opacity-90 font-bold"
                  >
                    ✓
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2 text-xs font-bold text-[var(--solar-base1)]">
                    Entrega Prevista: {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'N/A'}
                  </div>
                )}

                 <button 
                  title="Excluir"
                  onClick={() => {
                    if(confirm('Excluir esta Ordem de Serviço?')) {
                      deleteOrder(order.id);
                      loadData();
                    }
                  }}
                  className="w-10 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] rounded flex items-center justify-center hover:bg-opacity-40 transition-colors"
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
            <button onClick={() => setIsAdding(true)} className="text-[var(--solar-orange)] mt-2 hover:underline font-bold">Crie seu primeiro orçamento</button>
          </div>
        )}
      </div>
    </div>
  );
}
