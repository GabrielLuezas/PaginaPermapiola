import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Calendar } from './components/calendar/calendar';
import { Changelog } from './components/changelog/changelog';
import { Players } from './components/players/players';
import { Deaths } from './components/deaths/deaths';
import { Ranks } from './components/ranks/ranks';
import { Rules } from './components/rules/rules';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'calendar', component: Calendar },
  { path: 'changelog', component: Changelog },
  { path: 'players', component: Players },
  { path: 'deaths', component: Deaths },
  { path: 'ranks', component: Ranks },
  { path: 'rules', component: Rules },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', redirectTo: 'home' }
];
