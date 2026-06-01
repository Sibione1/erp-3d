"use client";

import { useState, useEffect } from 'react';
import { Filament } from '../../types';
import { getStorageData, addFilament, deleteFilament, updateFilament } from '../../lib/storage';

export default function FilamentosPage() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    colorName: '',
    colorHex: '#ffffff',
    material: 'PLA',
    initialWeightG: 1000,
    currentWeightG: 1000,
    purchaseCost: 0,
    tempPrintStart: 200,
    tempPrintEnd: 220,
    tempBedStart: 60,
    tempBedEnd: 60,
  });

  const loadFilaments = () => {
    setFilaments(getStorageData<Filament>('filaments'));
  };

  useEffect(() => {
    loadFilaments();
    const handleStorage = () => loadFilaments();
    window.addEventListener('storage-updated', handleStorage);
    return () => window.removeEventListener('storage-updated', handleStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFilament({
      ...formData,
      initialWeightG: Number(formData.initialWeightG),
      currentWeightG: Number(formData.currentWeightG),
      purchaseCost: Number(formData.purchaseCost),
      tempPrintStart: Number(formData.tempPrintStart),
      tempPrintEnd: Number(formData.tempPrintEnd),
      tempBedStart: Number(formData.tempBedStart),
      tempBedEnd: Number(formData.tempBedEnd),
    });
    setIsAdding(false);
    loadFilaments();
  };

  const handleUpdateWeight = (id: string, usedGrams: number) => {
    const filament = filaments.find(f => f.id === id);
    if (filament) {
      const newWeight = Math.max(0, filament.currentWeightG - usedGrams);
      updateFilament(id, { currentWeightG: newWeight });
      loadFilaments();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--solar-base2)]">Estoque de Filamentos</h2>
          <p className="text-[var(--solar-base1)] mt-1">Gerencie seus rolos, cores e controle as gramas restantes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--solar-green)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          {isAdding ? 'Cancelar' : '+ Novo Rolo'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Adicionar Novo Rolo</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Marca</label>
              <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Cor (Nome)</label>
              <input required type="text" value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Código Hex da Cor</label>
              <div className="flex gap-2">
                <input type="color" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="h-10 w-10 rounded cursor-pointer" />
                <input type="text" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="flex-1 bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Material</label>
              <select value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]">
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
                <option value="ASA">ASA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Peso Inicial (g)</label>
              <input required type="number" value={formData.initialWeightG} onChange={e => setFormData({...formData, initialWeightG: Number(e.target.value), currentWeightG: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Custo de Compra (R$)</label>
              <input required type="number" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            
            {/* Especificações de temperatura */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[var(--solar-base01)] pt-4 mt-2">
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Bico Início (°C)</label>
                <input type="number" value={formData.tempPrintStart} onChange={e => setFormData({...formData, tempPrintStart: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Bico Fim (°C)</label>
                <input type="number" value={formData.tempPrintEnd} onChange={e => setFormData({...formData, tempPrintEnd: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Mesa Início (°C)</label>
                <input type="number" value={formData.tempBedStart} onChange={e => setFormData({...formData, tempBedStart: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--solar-base1)] mb-1">Mesa Fim (°C)</label>
                <input type="number" value={formData.tempBedEnd} onChange={e => setFormData({...formData, tempBedEnd: Number(e.target.value)})} className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-4">
              <button type="submit" className="bg-[var(--solar-blue)] text-[var(--solar-base2)] px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity">
                Salvar Filamento
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filaments.map(filament => {
          const percentLeft = (filament.currentWeightG / filament.initialWeightG) * 100;
          const isLow = filament.currentWeightG < 100;
          const costPerGram = (filament.purchaseCost / filament.initialWeightG).toFixed(2);

          return (
            <div key={filament.id} className="bg-[var(--solar-base02)] rounded-xl border border-[var(--solar-base01)] overflow-hidden shadow-sm flex flex-col">
              <div className="h-4 w-full" style={{ backgroundColor: filament.colorHex }}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-[var(--solar-base2)]">{filament.brand}</h3>
                  <span className="bg-[var(--solar-base03)] text-[var(--solar-base1)] text-xs px-2 py-1 rounded border border-[var(--solar-base01)]">{filament.material}</span>
                </div>
                <p className="text-[var(--solar-base1)] mb-4">{filament.colorName}</p>
                
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--solar-base1)]">Restante</span>
                    <span className={`font-bold ${isLow ? 'text-[var(--solar-red)]' : 'text-[var(--solar-green)]'}`}>
                      {filament.currentWeightG}g / {filament.initialWeightG}g
                    </span>
                  </div>
                  <div className="w-full bg-[var(--solar-base03)] rounded-full h-2.5 mb-4">
                    <div className={`h-2.5 rounded-full ${isLow ? 'bg-[var(--solar-red)]' : 'bg-[var(--solar-green)]'}`} style={{ width: `${Math.max(0, Math.min(100, percentLeft))}%` }}></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t border-[var(--solar-base01)] pt-4">
                    <div>
                      <p className="text-[var(--solar-base1)] text-xs">Custo de Compra</p>
                      <p className="text-[var(--solar-base2)] font-mono">R$ {filament.purchaseCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--solar-base1)] text-xs">Custo por Grama</p>
                      <p className="text-[var(--solar-base2)] font-mono">R$ {costPerGram}</p>
                    </div>
                    <div>
                      <p className="text-[var(--solar-base1)] text-xs">Temp. Bico</p>
                      <p className="text-[var(--solar-base2)] font-mono">{filament.tempPrintStart}-{filament.tempPrintEnd}°C</p>
                    </div>
                    <div>
                      <p className="text-[var(--solar-base1)] text-xs">Temp. Mesa</p>
                      <p className="text-[var(--solar-base2)] font-mono">{filament.tempBedStart}-{filament.tempBedEnd}°C</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--solar-base01)] flex gap-2">
                   <button 
                    onClick={() => handleUpdateWeight(filament.id, 50)}
                    className="flex-1 bg-[var(--solar-base03)] border border-[var(--solar-base01)] text-[var(--solar-base1)] text-xs py-2 rounded hover:bg-[var(--solar-base01)] hover:text-[var(--solar-base3)] transition-colors"
                   >
                     - 50g (Simular)
                   </button>
                   <button 
                    onClick={() => {
                      if(confirm('Excluir este filamento?')) {
                        deleteFilament(filament.id);
                        loadFilaments();
                      }
                    }}
                    className="flex-1 bg-[var(--solar-red)] bg-opacity-20 text-[var(--solar-red)] text-xs py-2 rounded hover:bg-opacity-40 transition-colors"
                   >
                     Excluir
                   </button>
                </div>
              </div>
            </div>
          );
        })}
        {filaments.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--solar-base01)] rounded-xl">
            <p className="text-[var(--solar-base1)]">Nenhum filamento em estoque.</p>
            <button onClick={() => setIsAdding(true)} className="text-[var(--solar-blue)] mt-2 hover:underline">Adicione o primeiro rolo</button>
          </div>
        )}
      </div>
    </div>
  );
}
