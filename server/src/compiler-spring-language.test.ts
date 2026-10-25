import { describe,expect,it,vi } from 'vitest';
import { compileRules } from './compiler';
import { loadConfig } from './config';
import { SPRING_LANGUAGE_POLICY } from '../../shared/spring-language';
import { toaster } from '../../client/src/levels/toaster';
import { initialRules } from '../../client/src/levels/rules';

describe('spring language in the model prompt (mocked contract)',()=>{
  it.each(['toaster增加弹性','toaster增加弹力'])('includes the shared interpretation for %s',async text=>{
    const before=initialRules(toaster);
    const operations=[{type:'add_property',target:'spring-main',property:'spring_power',amount:1}];
    const fetcher=vi.fn<typeof fetch>(async (_url,init)=>{
      const body=JSON.parse(String(init?.body));
      expect(body.messages[0].content).toContain(SPRING_LANGUAGE_POLICY);
      expect(JSON.parse(body.messages[1].content).level.description).toContain('launch strength');
      return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'m',operations,error:null,understoodAs:'Toaster: Spring strength + 1.'}]})}}]});
    });
    const result=await compileRules({requestId:'spring-meaning',levelId:'toaster',sceneVersion:1,queueRevision:1,rules:before,messages:[{id:'m',text}]},loadConfig({AI_API_KEY:'test-only'}),undefined,fetcher);
    expect(result.messages[0]).toMatchObject({operations,understoodAs:'Toaster: Spring strength + 1.'});
    expect(fetcher).toHaveBeenCalledTimes(1);expect(before).toEqual(initialRules(toaster));
  });
});
