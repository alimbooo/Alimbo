import React from 'react';
import GithubIcon from './github.svg';
import InstagramIcon from './instagram.svg';
import LinkedinIcon from './linkedin.svg';
import TelegramIcon from './telegram.svg';
import XIcon from './x.svg';
import YoutubeIcon from './youtube.svg';
import LinkIcon from './link.svg';
import LocationIcon from './location.svg';
import BirthDateIcon from './birthDate.svg';
import UserIcon from './user.svg';
import MilitaryServiceIcon from './militaryService.svg';
import PhoneIcon from './phone.svg';
import EmailIcon from './email.svg';
import LeftIcon from './left.svg';


export const icons = {
  github: GithubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  telegram: TelegramIcon,
  x: XIcon,
  youtube: YoutubeIcon,
  link: LinkIcon,
  location: LocationIcon,
  birthDate: BirthDateIcon,
  user: UserIcon,
  militaryService: MilitaryServiceIcon,
  phone: PhoneIcon,
  email: EmailIcon,
  left: LeftIcon,

};

export type IconName = keyof typeof icons;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const SvgIcon = icons[name];
  if (!SvgIcon) return null;
  return <SvgIcon {...props} />;
};
