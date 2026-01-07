'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { USE_CASES, UseCase } from '@/lib/constants/use-cases'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (useCase: UseCase, template: string) => void
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  onSelectTemplate
}: TemplateSelectorDialogProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleTemplateSelect = (template: string) => {
    if (selectedUseCase) {
      setSelectedTemplate(template)
      console.log('[FounderVox:TemplateSelector] Selected template:', {
        useCase: selectedUseCase.title,
        template
      })
      onSelectTemplate(selectedUseCase, template)
      // Reset and close
      setSelectedUseCase(null)
      setSelectedTemplate(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Recording Template</DialogTitle>
          <DialogDescription>
            Choose a use case and template to optimize your recording
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedUseCase ? (
            // Template Selection View
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUseCase(null)}
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2">
                  <selectedUseCase.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{selectedUseCase.title}</h3>
                </div>
              </div>

              <div className="grid gap-2">
                {selectedUseCase.templates.map((template) => (
                  <button
                    key={template}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-black',
                      selectedTemplate === template
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200'
                    )}
                  >
                    <span className="text-sm font-medium">{template}</span>
                    {selectedTemplate === template && (
                      <Check className="h-5 w-5 text-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Use Case Selection View
            <div className="grid gap-3">
              {USE_CASES.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setSelectedUseCase(useCase)}
                  className="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-black transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                    <useCase.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{useCase.title}</h3>
                      {useCase.badge && (
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            useCase.badge === 'new'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          )}
                        >
                          {useCase.badge === 'new' ? 'NEW' : 'FOUNDER'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{useCase.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {useCase.templates.length} templates available
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
