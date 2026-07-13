import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Calendar } from './components/calendar/calendar';
import { Changelog } from './components/changelog/changelog';
import { Players } from './components/players/players';
import { Deaths } from './components/deaths/deaths';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'calendar', component: Calendar },
  { path: 'changelog', component: Changelog },
  { path: 'players', component: Players },
  { path: 'deaths', component: Deaths },
  { path: '**', redirectTo: 'home' }
];
