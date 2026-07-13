import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChangelogChange {
  type: 'added' | 'removed' | 'fixed' | 'adjusted';
  text: string;
}

interface ChangelogVersion {
  version: string;
  codename: string;
  date: string;
  isLatest: boolean;
  changes: ChangelogChange[];
}

@Component({
  selector: 'app-changelog',
  imports: [CommonModule],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css'
})
export class Changelog {
  protected readonly changelogs = signal<ChangelogVersion[]>([
    {
      version: 'v1.2.0',
      codename: 'La Amenaza del Evoker',
      date: '12 de Julio, 2026',
      isLatest: true,
      changes: [
        { type: 'added', text: 'Nuevo Boss Customizado: EvokerBoss. Aparece en arenas especiales e invoca súbditos mortales.' },
        { type: 'added', text: 'Sistema de Habilidades del Invocador: Lanza hachas de piedra teledirigidas (AxeThrow) y canaliza un rayo giratorio letal (SpinningBeam).' },
        { type: 'added', text: 'Nueva Interfaz de Alianzas: PartyGUI. Crea escuadras, activa o desactiva fuego amigo y comparte coordenadas.' },
        { type: 'added', text: 'Mecánica de Almacenamiento de Muertes: DeadPlayerItemStorage. Los items del jugador que muere de forma permanente se guardan en un cofre seguro reclamable únicamente por su asesino o equipo.' },
        { type: 'fixed', text: 'Bug solucionado con la recolección de tótems en cuevas de bedrock.' },
        { type: 'adjusted', text: 'Incrementado el daño por congelamiento en biomas nevados.' }
      ]
    },
    {
      version: 'v1.1.0',
      codename: 'Almas y Espectadores',
      date: '05 de Julio, 2026',
      isLatest: false,
      changes: [
        { type: 'added', text: 'Habilitado el modo Espectador Permanente en caso de perder la última vida.' },
        { type: 'added', text: 'Añadida la interfaz de selección de arenas para combate contra jefes (TestArenaSelectGUI).' },
        { type: 'added', text: 'Integración de chat de proximidad por voz (opcional).' },
        { type: 'fixed', text: 'Corregido error de duplicación de inventario en portales del Nether.' },
        { type: 'adjusted', text: 'Reducido el índice de generación de manzanas doradas en cofres de bastiones.' }
      ]
    },
    {
      version: 'v1.0.0',
      codename: 'Génesis de la Supervivencia',
      date: '28 de Junio, 2026',
      isLatest: false,
      changes: [
        { type: 'added', text: 'Lanzamiento de la base del servidor Permapiola.' },
        { type: 'added', text: 'Sistema de corazones y vida en pantalla con visualización en tiempo real.' },
        { type: 'added', text: 'Protección de Spawn temporal (primeros 5 minutos).' },
        { type: 'added', text: 'Dificultad Hardcore por defecto.' }
      ]
    }
  ]);
}
