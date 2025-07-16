import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Eye, Table, FileText, Ruler } from 'lucide-react';

interface SizeEntry {
  size: string;
  measurements: {
    bust?: string;
    waist?: string;
    hip?: string;
    length?: string;
    shoulder?: string;
    inseam?: string;
    [key: string]: string | undefined;
  };
}

interface SizeGuideBuilderProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

export const SizeGuideBuilder: React.FC<SizeGuideBuilderProps> = ({ initialContent, onChange }) => {
  const [activeTab, setActiveTab] = useState('table');
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [customMeasurements, setCustomMeasurements] = useState<string[]>(['bust', 'waist', 'hip', 'length']);
  const [instructions, setInstructions] = useState('');
  const [productImage, setProductImage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const getMeasurementLabel = (measurement: string) => {
    const labels: { [key: string]: string } = {
      bust: 'Busto',
      waist: 'Cintura',
      hip: 'Quadril',
      length: 'Comp. Lateral',
      shoulder: 'Ombro',
      inseam: 'Entreperna',
      chest: 'Peito',
      sleeve: 'Manga'
    };
    return labels[measurement] || measurement;
  };

  const generateContent = (): string => {
    let html = '<div class="size-guide-container">';
    
    // Product image and basic info
    if (productImage) {
      html += `<div class="product-info">
        <img src="${productImage}" alt="Produto" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;" />
      </div>`;
    }

    // Size table
    if (sizes.length > 0) {
      html += '<div class="size-table-container">';
      html += '<table class="size-table" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">';
      
      // Header
      html += '<thead><tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">';
      html += '<th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #dee2e6;">Tamanho</th>';
      
      const allMeasurements = [...new Set(sizes.flatMap(s => Object.keys(s.measurements)))];
      allMeasurements.forEach(measurement => {
        const label = getMeasurementLabel(measurement);
        html += `<th style="padding: 12px; text-align: center; font-weight: 600; border-right: 1px solid #dee2e6;">${label}</th>`;
      });
      
      html += '</tr></thead>';
      
      // Body
      html += '<tbody>';
      sizes.forEach((size, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        html += `<tr style="background-color: ${bgColor}; border-bottom: 1px solid #dee2e6;">`;
        html += `<td style="padding: 12px; font-weight: 600; border-right: 1px solid #dee2e6;">${size.size}</td>`;
        
        allMeasurements.forEach(measurement => {
          const value = size.measurements[measurement] || '-';
          html += `<td style="padding: 12px; text-align: center; border-right: 1px solid #dee2e6;">${value}</td>`;
        });
        
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>';
    }

    // Instructions
    if (instructions) {
      html += '<div class="instructions-container" style="margin-top: 24px;">';
      html += '<h3 style="margin-bottom: 16px; font-weight: 600; color: #374151;">Como medir</h3>';
      html += '<div class="instructions" style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">';
      html += `<p style="margin: 0; white-space: pre-wrap;">${instructions}</p>`;
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    setPreviewContent(html);
    onChange(html);
    return html;
  };

  const parseInitialContent = (content: string) => {
    try {
      console.log('SizeGuideBuilder: parsing initial content', content);
      // Try to parse HTML content and extract structured data
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Extract size table if exists
      const table = doc.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        const headers = Array.from(rows[0]?.querySelectorAll('th') || []).map(th => th.textContent?.trim() || '');
        
        const parsedSizes: SizeEntry[] = [];
        for (let i = 1; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          if (cells.length > 0) {
            const size = cells[0];
            const measurements: any = {};
            
            for (let j = 1; j < cells.length; j++) {
              const header = headers[j]?.toLowerCase();
              if (header) {
                measurements[header] = cells[j];
              }
            }
            
            parsedSizes.push({ size, measurements });
          }
        }
        
        setSizes(parsedSizes);
      }
      
      // Extract instructions
      const instructionsDiv = doc.querySelector('.instructions');
      if (instructionsDiv) {
        setInstructions(instructionsDiv.textContent || '');
      }
    } catch (error) {
      console.error('Error parsing content:', error);
    }
  };

  // Initialize component
  useEffect(() => {
    if (initialContent && !isInitialized) {
      console.log('SizeGuideBuilder: initializing with content');
      parseInitialContent(initialContent);
      setIsInitialized(true);
    } else if (!initialContent && !isInitialized) {
      console.log('SizeGuideBuilder: initializing empty');
      generateContent();
      setIsInitialized(true);
    }
  }, [initialContent, isInitialized]);

  // Update content when data changes
  useEffect(() => {
    if (isInitialized) {
      console.log('SizeGuideBuilder: updating content');
      generateContent();
    }
  }, [sizes, instructions, productImage, isInitialized]);

  const addSize = () => {
    const newSize: SizeEntry = {
      size: '',
      measurements: {}
    };
    
    customMeasurements.forEach(measurement => {
      newSize.measurements[measurement] = '';
    });
    
    setSizes([...sizes, newSize]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: 'size' | 'measurements', value: any) => {
    const newSizes = [...sizes];
    if (field === 'size') {
      newSizes[index].size = value;
    } else {
      newSizes[index].measurements = value;
    }
    setSizes(newSizes);
  };

  const updateMeasurement = (sizeIndex: number, measurement: string, value: string) => {
    const newSizes = [...sizes];
    newSizes[sizeIndex].measurements[measurement] = value;
    setSizes(newSizes);
  };

  const addCustomMeasurement = () => {
    const newMeasurement = prompt('Nome da medida:');
    if (newMeasurement && !customMeasurements.includes(newMeasurement)) {
      setCustomMeasurements([...customMeasurements, newMeasurement]);
    }
  };

  const removeCustomMeasurement = (measurement: string) => {
    setCustomMeasurements(customMeasurements.filter(m => m !== measurement));
    setSizes(sizes.map(size => {
      const newMeasurements = { ...size.measurements };
      delete newMeasurements[measurement];
      return { ...size, measurements: newMeasurements };
    }));
  };

  const presetSizes = [
    { size: 'P', measurements: { bust: '84-88cm', waist: '64-68cm', hip: '90-94cm', length: '103cm' } },
    { size: 'M', measurements: { bust: '88-92cm', waist: '68-72cm', hip: '94-98cm', length: '104cm' } },
    { size: 'G', measurements: { bust: '92-96cm', waist: '72-76cm', hip: '98-102cm', length: '105cm' } },
    { size: 'GG', measurements: { bust: '96-100cm', waist: '76-80cm', hip: '102-106cm', length: '106cm' } }
  ];

  const loadPresetSizes = () => {
    setSizes(presetSizes);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tabela de Medidas
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Instruções
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Configurar Medidas
              </CardTitle>
              <CardDescription>
                Configure as medidas para cada tamanho do produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Measurements Configuration */}
              <div className="space-y-3">
                <Label>Tipos de Medidas</Label>
                <div className="flex flex-wrap gap-2">
                  {customMeasurements.map(measurement => (
                    <Badge key={measurement} variant="secondary" className="flex items-center gap-1">
                      {getMeasurementLabel(measurement)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomMeasurement(measurement)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomMeasurement}
                    className="h-6"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadPresetSizes}>
                  Carregar Tamanhos Padrão
                </Button>
                <Button variant="outline" onClick={addSize}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tamanho
                </Button>
              </div>

              {/* Size Entries */}
              <div className="space-y-4">
                {sizes.map((size, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Tamanho (ex: P, M, G)"
                          value={size.size}
                          onChange={(e) => updateSize(index, 'size', e.target.value)}
                          className="w-32"
                        />
                        <Badge variant="outline">{size.size || 'Novo'}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSize(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {customMeasurements.map(measurement => (
                        <div key={measurement} className="space-y-2">
                          <Label>{getMeasurementLabel(measurement)}</Label>
                          <Input
                            placeholder="Ex: 84-88cm"
                            value={size.measurements[measurement] || ''}
                            onChange={(e) => updateMeasurement(index, measurement, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Como Medir</CardTitle>
              <CardDescription>
                Adicione instruções sobre como tirar as medidas corretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Para selecionar o tamanho correto do look, recomendamos que verifique as seguintes medidas com uma fita métrica. Se necessário, peça a ajuda de alguém..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
              <CardDescription>
                Veja como ficará a guia de medidas no produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 bg-background"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};