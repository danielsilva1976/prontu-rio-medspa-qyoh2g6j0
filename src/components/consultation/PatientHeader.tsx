import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  MapPin,
  Briefcase,
  CreditCard,
  Edit2,
  Phone,
  History,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import CompleteHistoryModal from './CompleteHistoryModal'
import useAuditStore from '@/stores/useAuditStore'
import usePatientStore from '@/stores/usePatientStore'

type Props = {
  patient: any
  id: string
  isFinalized: boolean
  onFinalize: () => void
}

export default function PatientHeader({ patient, id, isFinalized, onFinalize }: Props) {
  const { addLog } = useAuditStore()
  const { patients, updatePatient } = usePatientStore()

  const storePatient = patients.find((p) => p.id === id)
  const displayPatient = storePatient || patient

  const [editInfo, setEditInfo] = useState({
    cpf: storePatient?.cpf || '123.456.789-00',
    rg: storePatient?.rg || '12.345.678-9',
    profissao: storePatient?.profissao || 'Engenheira de Software',
    estado_civil: storePatient?.estado_civil || 'Casada',
    telefone: storePatient?.phone || '(11) 98765-4321',
    email: storePatient?.email || 'paciente@email.com',
    endereco: storePatient?.endereco || 'Rua das Flores, 123 - São Paulo/SP',
    avatar: storePatient?.avatar || '',
  })

  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  useEffect(() => {
    if (storePatient && isOpen) {
      setEditInfo({
        cpf: storePatient.cpf || '',
        rg: storePatient.rg || '',
        profissao: storePatient.profissao || '',
        estado_civil: storePatient.estado_civil || '',
        telefone: storePatient.phone || '',
        email: storePatient.email || '',
        endereco: storePatient.endereco || '',
        avatar: storePatient.avatar || '',
      })
    }
  }, [storePatient, isOpen])

  const handleSave = () => {
    if (storePatient) {
      updatePatient(id, {
        cpf: editInfo.cpf,
        rg: editInfo.rg,
        profissao: editInfo.profissao,
        estado_civil: editInfo.estado_civil,
        phone: editInfo.telefone,
        email: editInfo.email,
        endereco: editInfo.endereco,
        avatar: editInfo.avatar,
      })
    }
    setIsOpen(false)
    addLog('Dados do paciente editados', id)
  }

  const handleOpenHistory = () => {
    setIsHistoryOpen(true)
    addLog('Histórico Completo visualizado', id)
  }

  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <Link to="/pacientes">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-16 w-16 border border-border mt-0.5 shadow-sm shrink-0">
          <AvatarImage src={displayPatient.avatar} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
            {displayPatient.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2 truncate">
              {displayPatient.name}
            </h1>

            {isFinalized ? (
              <Badge
                variant="outline"
                className="text-destructive border-destructive bg-destructive/5 hidden sm:flex items-center gap-1.5 px-3 py-0.5 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                Consulta Finalizada - Edição Desabilitada
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-primary border-primary bg-primary/5 shrink-0 hidden sm:inline-flex"
              >
                Atendimento em curso
              </Badge>
            )}

            {!isFinalized && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl text-primary">
                      Editar Dados do Paciente
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Foto de Perfil</Label>
                      <ImageUpload
                        value={editInfo.avatar}
                        onChange={(val) => setEditInfo({ ...editInfo, avatar: val })}
                        nameInitials={displayPatient.name}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={editInfo.cpf}
                          onChange={(e) => setEditInfo({ ...editInfo, cpf: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          value={editInfo.rg}
                          onChange={(e) => setEditInfo({ ...editInfo, rg: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profissao">Profissão</Label>
                        <Input
                          id="profissao"
                          value={editInfo.profissao}
                          onChange={(e) => setEditInfo({ ...editInfo, profissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_civil">Estado Civil</Label>
                        <Input
                          id="estado_civil"
                          value={editInfo.estado_civil}
                          onChange={(e) =>
                            setEditInfo({ ...editInfo, estado_civil: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={editInfo.telefone}
                          onChange={(e) => setEditInfo({ ...editInfo, telefone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          value={editInfo.email}
                          onChange={(e) => setEditInfo({ ...editInfo, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <Input
                          id="endereco"
                          value={editInfo.endereco}
                          onChange={(e) => setEditInfo({ ...editInfo, endereco: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-primary/70" /> {displayPatient.age} anos
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary/70" />{' '}
              {storePatient?.cpf || editInfo.cpf}
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <Briefcase className="h-3.5 w-3.5 text-primary/70" />{' '}
              {storePatient?.profissao || editInfo.profissao}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary/70" />{' '}
              {storePatient?.phone || editInfo.telefone}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hidden sm:flex">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{storePatient?.endereco || editInfo.endereco}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto mt-4 md:mt-0">
        <Button
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary/5 w-full sm:w-auto"
          onClick={handleOpenHistory}
        >
          <History className="w-4 h-4 mr-2" />
          Histórico Completo
        </Button>
        {!isFinalized && (
          <Button
            onClick={onFinalize}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
          >
            Finalizar Atendimento
          </Button>
        )}
      </div>

      <CompleteHistoryModal
        isOpen={isHistoryOpen}
        onClose={setIsHistoryOpen}
        patient={displayPatient}
      />
    </div>
  )
}
