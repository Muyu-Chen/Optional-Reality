import { describe, expect, it } from 'vitest';
import { captionHeads, type Caption } from './RuleCaption';
const caption=(id:string,group:string):Caption=>({id,group,lines:[id]});
describe('environment caption timing groups',()=>{
  it('starts a new manual-send caption immediately alongside the previous one',()=>{
    expect(captionHeads([caption('gravity','send-1'),caption('fan','send-2')]).map(item=>item.id)).toEqual(['gravity','fan']);
  });
  it('shows batch messages in order, advancing only when the previous caption finishes',()=>{
    const batch=[caption('first','batch'),caption('second','batch')];
    expect(captionHeads(batch).map(item=>item.id)).toEqual(['first']);
    expect(captionHeads(batch.slice(1)).map(item=>item.id)).toEqual(['second']);
  });
  it('does not delay a new manual message behind an older batch',()=>{
    expect(captionHeads([caption('old','batch'),caption('waiting','batch'),caption('new','manual')]).map(item=>item.id)).toEqual(['old','new']);
  });
});
