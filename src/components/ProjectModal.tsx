import { useState, useRef } from 'react';
import { addProject } from '../lib/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

export default function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    estimatedPrintTimeMinutes: 0,
    estimatedConsumptionG: 0,
    successRate: 100,
  });
  const [imageUrl, setImageUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande! Escolha uma imagem de até 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject = addProject({
      ...formData,
      imageUrl
    });
    onSuccess(newProject.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--solar-base02)] p-6 rounded-xl border border-[var(--solar-base01)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--solar-base2)] mb-4">Cadastrar Novo Projeto 3D</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Nome do Projeto *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Vaso Geométrico" className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--solar-base1)] mb-1">Print de Tela (Bambu Studio)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-[var(--solar-base01)] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-[var(--solar-base0)] transition-colors"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="h-full object-cover" />
              ) : (
                <div className="text-center text-[var(--solar-base1)]">
                  <p>📁 Clique para anexar o Print</p>
                  <p className="text-xs mt-1">Máx 2MB (Para salvar no navegador)</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Tempo Total (Minutos) *</label>
              <input required type="number" value={formData.estimatedPrintTimeMinutes || ''} onChange={e => setFormData({...formData, estimatedPrintTimeMinutes: Number(e.target.value)})} placeholder="Ex: 120 (2 horas)" className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
            <div>
              <label className="block text-sm text-[var(--solar-base1)] mb-1">Consumo Total (Gramas) *</label>
              <input required type="number" value={formData.estimatedConsumptionG || ''} onChange={e => setFormData({...formData, estimatedConsumptionG: Number(e.target.value)})} placeholder="Ex: 85" className="w-full bg-[var(--solar-base03)] border border-[var(--solar-base01)] rounded p-2 text-[var(--solar-base0)]" />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-[var(--solar-base01)]">
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--solar-base01)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-[var(--solar-blue)] text-[var(--solar-base03)] px-4 py-2 rounded font-bold hover:opacity-90">
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
