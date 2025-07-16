/**
 * Utility functions for handling product detail templates
 */

export interface ProductDetailsTemplate {
  id: string;
  name: string;
  type: string;
  content: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Renders template content as HTML, handling both legacy JSON and new HTML formats
 */
export const renderTemplateContent = (template: ProductDetailsTemplate): string => {
  if (!template || !template.content) return '';

  // If content is a string, return it directly
  if (typeof template.content === 'string') {
    return template.content;
  }

  // If content has html property, use it
  if (template.content.html) {
    return template.content.html;
  }

  // If content has text property, use it
  if (template.content.text) {
    return template.content.text;
  }

  // Handle legacy JSON formats for different template types
  if (template.type === 'size_guide') {
    return renderSizeGuideFromJSON(template.content);
  }

  if (template.type === 'composition') {
    return renderCompositionFromJSON(template.content);
  }

  if (template.type === 'care_instructions') {
    return renderCareInstructionsFromJSON(template.content);
  }

  // Fallback: return JSON as formatted text
  return `<pre>${JSON.stringify(template.content, null, 2)}</pre>`;
};

/**
 * Converts legacy size guide JSON to HTML
 */
const renderSizeGuideFromJSON = (content: any): string => {
  if (!content || typeof content !== 'object') return '';

  let html = '<div class="size-guide">';
  
  // Handle direct size entries (P, M, G, GG)
  const sizeEntries = Object.entries(content).filter(([key]) => 
    ['P', 'M', 'G', 'GG', 'PP', 'XG', 'XXG'].includes(key)
  );

  if (sizeEntries.length > 0) {
    html += '<div class="size-chart">';
    sizeEntries.forEach(([size, measurements]: [string, any]) => {
      if (measurements && typeof measurements === 'object') {
        html += `<div class="size-entry">`;
        html += `<strong>${size}:</strong> `;
        const parts = [];
        if (measurements.bust) parts.push(`Busto: ${measurements.bust}`);
        if (measurements.waist) parts.push(`Cintura: ${measurements.waist}`);
        if (measurements.hip) parts.push(`Quadril: ${measurements.hip}`);
        html += parts.join(' | ');
        html += `</div>`;
      }
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
};

/**
 * Converts legacy composition JSON to HTML
 */
const renderCompositionFromJSON = (content: any): string => {
  if (!content || typeof content !== 'object') return '';

  let html = '<div class="composition">';
  
  if (content.materials) {
    html += `<p><strong>Material:</strong> ${Array.isArray(content.materials) ? content.materials.join(', ') : content.materials}</p>`;
  }
  
  if (content.origin) {
    html += `<p><strong>Origem:</strong> ${content.origin}</p>`;
  }
  
  if (content.certifications && Array.isArray(content.certifications) && content.certifications.length > 0) {
    html += `<p><strong>Certificações:</strong> ${content.certifications.join(', ')}</p>`;
  }
  
  html += '</div>';
  return html;
};

/**
 * Converts legacy care instructions JSON to HTML
 */
const renderCareInstructionsFromJSON = (content: any): string => {
  if (!content || typeof content !== 'object') return '';

  let html = '<div class="care-instructions">';
  
  if (content.washing) {
    html += `<p>• ${content.washing}</p>`;
  }
  
  if (content.drying) {
    html += `<p>• ${content.drying}</p>`;
  }
  
  if (content.ironing) {
    html += `<p>• ${content.ironing}</p>`;
  }
  
  if (content.bleaching) {
    html += `<p>• ${content.bleaching}</p>`;
  }
  
  if (content.dry_cleaning) {
    html += `<p>• ${content.dry_cleaning}</p>`;
  }
  
  html += '</div>';
  return html;
};

/**
 * Gets raw content for editing, handling both formats
 */
export const getEditableContent = (template: ProductDetailsTemplate): string => {
  if (!template || !template.content) return '';

  // If content is a string, return it directly
  if (typeof template.content === 'string') {
    return template.content;
  }

  // If content has html property, use it
  if (template.content.html) {
    return template.content.html;
  }

  // If content has text property, use it
  if (template.content.text) {
    return template.content.text;
  }

  // For legacy JSON, return as formatted JSON string
  return JSON.stringify(template.content, null, 2);
};

/**
 * Prepares content for saving to database
 */
export const prepareContentForSave = (content: string): { html: string } => {
  return { html: content };
};